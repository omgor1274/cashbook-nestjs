import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create.user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  UserAddressDetailsDto,
  UserEmergencyContactDto,
} from './dto/user-profile.dto';
import { UserPermissionsDto } from './dto/user-permissions.dto';
import { createDefaultUserPermissions, UserPermissions } from './permissions.constants';
import {
  createDefaultAddressDetails,
  createDefaultEmergencyContact,
  SalaryCycle,
  UserAddressDetails,
  UserEmergencyContact,
} from './profile.constants';
import { UserRole } from './user.enum';
import { UserRoleCounter, UserRoleCounterDocument } from './schemas/user-role-counter.schema';
import { User, Userdocument } from './schemas/user.schema';

@Injectable()
export class UserService {
  private readonly rolePrefixMap: Record<
    UserRole.SUPERVISOR | UserRole.SUB_ADMIN | UserRole.WORKER | UserRole.VENDOR,
    string
  > = {
      [UserRole.SUPERVISOR]: 'S',
      [UserRole.SUB_ADMIN]: 'A',
      [UserRole.WORKER]: 'W',
      [UserRole.VENDOR]: 'V',
    };

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<Userdocument>,
    @InjectModel(UserRoleCounter.name)
    private readonly userRoleCounterModel: Model<UserRoleCounterDocument>,
  ) { }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeSpecialIndex(value: string): string {
    return value.trim().toUpperCase();
  }

  private normalizePermissions(
    permissions?: UserPermissions | null,
  ): UserPermissions {
    const defaults = createDefaultUserPermissions();
    return {
      ...defaults,
      ...(permissions ?? {}),
      users: {
        ...defaults.users,
        ...(permissions?.users ?? {}),
      },
    };
  }

  private normalizeAddressDetails(
    addressDetails?: UserAddressDetails | null,
  ): UserAddressDetails {
    const defaults = createDefaultAddressDetails();
    return {
      ...defaults,
      ...(addressDetails ?? {}),
    };
  }

  private normalizeEmergencyContact(
    emergencyContact?: UserEmergencyContact | null,
  ): UserEmergencyContact {
    const defaults = createDefaultEmergencyContact();
    return {
      ...defaults,
      ...(emergencyContact ?? {}),
    };
  }

  private mergePermissions(
    currentPermissions: UserPermissions | null | undefined,
    incomingPermissions: UserPermissionsDto,
  ): UserPermissions {
    const normalizedCurrent = this.normalizePermissions(currentPermissions);
    return {
      ...normalizedCurrent,
      ...(incomingPermissions as UserPermissions),
      users: {
        ...normalizedCurrent.users,
        ...(incomingPermissions.users ?? {}),
      },
    };
  }

  private mergeAddressDetails(
    currentAddressDetails: UserAddressDetails | null | undefined,
    incomingAddressDetails: UserAddressDetailsDto,
  ): UserAddressDetails {
    const normalizedCurrent = this.normalizeAddressDetails(currentAddressDetails);
    return {
      ...normalizedCurrent,
      ...(incomingAddressDetails as UserAddressDetails),
    };
  }

  private mergeEmergencyContact(
    currentEmergencyContact: UserEmergencyContact | null | undefined,
    incomingEmergencyContact: UserEmergencyContactDto,
  ): UserEmergencyContact {
    const normalizedCurrent = this.normalizeEmergencyContact(currentEmergencyContact);
    return {
      ...normalizedCurrent,
      ...(incomingEmergencyContact as UserEmergencyContact),
    };
  }

  private composeAddressFromDetails(addressDetails: UserAddressDetails): string | null {
    const candidates = [
      addressDetails.building,
      addressDetails.landmark,
      addressDetails.city,
      addressDetails.state,
    ];

    const parts = candidates
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter((value) => value.length > 0);

    return parts.length > 0 ? parts.join(', ') : null;
  }

  private sanitizeUser(user: any) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private getRolePrefix(role: UserRole): string | null {
    return this.rolePrefixMap[role as keyof typeof this.rolePrefixMap] ?? null;
  }

  private isAdminLikeRole(role: UserRole): boolean {
    return role === UserRole.ADMIN || role === UserRole.SUB_ADMIN;
  }

  private async generateSpecialIndex(role: UserRole): Promise<string> {
    const prefix = this.getRolePrefix(role);
    if (!prefix) {
      throw new BadRequestException('Unsupported role for special index generation');
    }

    const counter = await this.userRoleCounterModel
      .findOneAndUpdate(
        { role },
        { $inc: { sequence: 1 } },
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
      )
      .exec();

    if (!counter) {
      throw new BadRequestException('Unable to generate special index');
    }

    return `${prefix}${counter.sequence.toString().padStart(3, '0')}`;
  }

  private async generateUniqueSpecialIndex(role: UserRole): Promise<string> {
    const maxAttempts = 50;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const specialIndex = await this.generateSpecialIndex(role);
      const existingUser = await this.userModel.exists({ specialIndex });
      if (!existingUser) {
        return specialIndex;
      }
    }

    throw new BadRequestException('Unable to assign a unique special index');
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email: this.normalizeEmail(email) }).exec();
  }

  async createUser(createuserdto: CreateUserDto) {
    createuserdto.email = this.normalizeEmail(createuserdto.email);
    const specialIndex = await this.generateUniqueSpecialIndex(createuserdto.role);
    const permissions = this.normalizePermissions(
      createuserdto.permissions as UserPermissions,
    );
    const addressDetails = this.normalizeAddressDetails(
      createuserdto.addressDetails as UserAddressDetails,
    );
    const emergencyContact = this.normalizeEmergencyContact(
      createuserdto.emergencyContact as UserEmergencyContact,
    );

    const createdUser = new this.userModel({
      ...createuserdto,
      specialIndex,
      permissions,
      salaryCycle: createuserdto.salaryCycle ?? SalaryCycle.MONTHLY,
      faceRecognitionEnabled: createuserdto.faceRecognitionEnabled ?? false,
      faceRecognitionImage: createuserdto.faceRecognitionImage ?? null,
      addressDetails,
      emergencyContact,
    });

    return createdUser.save().then((user) => this.sanitizeUser(user.toObject()));
  }

  async globalSearchBySpecialIndex(query: string, limit = 20) {
    const normalizedQuery = this.normalizeSpecialIndex(query);
    const sanitizedLimit = Math.min(Math.max(limit, 1), 100);

    if (/^[ASVW]\d+$/.test(normalizedQuery)) {
      const user = await this.userModel
        .findOne({ specialIndex: normalizedQuery })
        .select('-password')
        .lean()
        .exec();

      return user ? [user] : [];
    }

    const escapedQuery = this.escapeRegex(normalizedQuery);
    return this.userModel
      .find({ specialIndex: { $regex: new RegExp(`^${escapedQuery}`) } })
      .select('-password')
      .sort({ specialIndex: 1 })
      .limit(sanitizedLimit)
      .lean()
      .exec();
  }

  async normalizeSpecialIndexData() {
    const supportedRoles = Object.keys(this.rolePrefixMap) as UserRole[];

    const usersWithoutSpecialIndex = await this.userModel
      .find({
        role: { $in: supportedRoles },
        $or: [
          { specialIndex: { $exists: false } },
          { specialIndex: null },
          { specialIndex: '' },
        ],
      })
      .select('_id role')
      .lean()
      .exec();

    let backfilledSpecialIndexes = 0;
    for (const user of usersWithoutSpecialIndex) {
      const role = user.role as UserRole;
      if (!this.getRolePrefix(role)) {
        continue;
      }

      const specialIndex = await this.generateUniqueSpecialIndex(role);
      const updateResult = await this.userModel
        .updateOne(
          {
            _id: user._id,
            $or: [
              { specialIndex: { $exists: false } },
              { specialIndex: null },
              { specialIndex: '' },
            ],
          },
          { $set: { specialIndex } },
        )
        .exec();

      if (updateResult.modifiedCount > 0) {
        backfilledSpecialIndexes++;
      }
    }

    const usersWithNonNormalizedSpecialIndex = await this.userModel
      .find({
        specialIndex: { $exists: true, $type: 'string', $regex: /[a-z]|\s/ },
      })
      .select('_id role specialIndex')
      .lean()
      .exec();

    let normalizedExistingSpecialIndexes = 0;
    for (const user of usersWithNonNormalizedSpecialIndex) {
      const normalizedSpecialIndex = this.normalizeSpecialIndex(String(user.specialIndex));
      if (normalizedSpecialIndex === user.specialIndex) {
        continue;
      }

      let targetSpecialIndex = normalizedSpecialIndex;
      const duplicate = await this.userModel.exists({
        _id: { $ne: user._id },
        specialIndex: normalizedSpecialIndex,
      });

      if (duplicate) {
        const role = user.role as UserRole;
        if (!this.getRolePrefix(role)) {
          continue;
        }
        targetSpecialIndex = await this.generateUniqueSpecialIndex(role);
      }

      await this.userModel
        .updateOne({ _id: user._id }, { $set: { specialIndex: targetSpecialIndex } })
        .exec();
      normalizedExistingSpecialIndexes++;
    }

    const permissionsBackfilledResult = await this.userModel
      .updateMany(
        { $or: [{ permissions: { $exists: false } }, { permissions: null }] },
        { $set: { permissions: createDefaultUserPermissions() } },
      )
      .exec();

    const salaryCycleBackfilledResult = await this.userModel
      .updateMany(
        { $or: [{ salaryCycle: { $exists: false } }, { salaryCycle: null }] },
        { $set: { salaryCycle: SalaryCycle.MONTHLY } },
      )
      .exec();

    const addressDetailsBackfilledResult = await this.userModel
      .updateMany(
        { $or: [{ addressDetails: { $exists: false } }, { addressDetails: null }] },
        { $set: { addressDetails: createDefaultAddressDetails() } },
      )
      .exec();

    const emergencyContactBackfilledResult = await this.userModel
      .updateMany(
        { $or: [{ emergencyContact: { $exists: false } }, { emergencyContact: null }] },
        { $set: { emergencyContact: createDefaultEmergencyContact() } },
      )
      .exec();

    const faceRecognitionFlagBackfilledResult = await this.userModel
      .updateMany(
        { $or: [{ faceRecognitionEnabled: { $exists: false } }, { faceRecognitionEnabled: null }] },
        { $set: { faceRecognitionEnabled: false } },
      )
      .exec();

    return {
      message: 'User data normalization completed',
      backfilledSpecialIndexes,
      normalizedExistingSpecialIndexes,
      permissionsBackfilled: permissionsBackfilledResult.modifiedCount,
      salaryCycleBackfilled: salaryCycleBackfilledResult.modifiedCount,
      addressDetailsBackfilled: addressDetailsBackfilledResult.modifiedCount,
      emergencyContactBackfilled: emergencyContactBackfilledResult.modifiedCount,
      faceRecognitionFlagBackfilled: faceRecognitionFlagBackfilledResult.modifiedCount,
    };
  }

  async getUserByIdByAdmin(userId: string) {
    const user = await this.userModel.findById(userId).select('-password').lean().exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getCurrentUserProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-password').lean().exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getCurrentUserMenu(userId: string) {
    const user = await this.getCurrentUserProfile(userId);
    const normalizedPermissions = this.normalizePermissions(
      user.permissions as UserPermissions,
    );
    const isAdminLike = this.isAdminLikeRole(user.role as UserRole);
    const isAdmin = (user.role as UserRole) === UserRole.ADMIN;
    const hasUserManagementPermission =
      normalizedPermissions.users.subAdmin ||
      normalizedPermissions.users.supervisor ||
      normalizedPermissions.users.worker ||
      normalizedPermissions.users.vendor;

    const canOpenReports =
      isAdminLike ||
      normalizedPermissions.bills ||
      normalizedPermissions.funds ||
      normalizedPermissions.salary ||
      normalizedPermissions.attendance ||
      normalizedPermissions.invoiceGeneration;

    return {
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        profilepicture: user.profilepicture,
      },
      permissions: normalizedPermissions,
      menu: {
        primary: [
          { key: 'profile_settings', label: 'Profile Settings', enabled: true },
          {
            key: 'generate_invoice',
            label: 'Generate Invoice',
            enabled: isAdminLike || normalizedPermissions.invoiceGeneration,
          },
          {
            key: 'bank_accounts',
            label: 'Bank Accounts',
            enabled: isAdminLike || normalizedPermissions.bankAccountManagement,
          },
          {
            key: 'attendance',
            label: 'Attendance',
            enabled: isAdminLike || normalizedPermissions.attendance,
          },
          {
            key: 'reports',
            label: 'Reports',
            enabled: canOpenReports,
          },
        ],
        management: [
          {
            key: 'manage_business',
            label: 'Manage Business',
            enabled: isAdminLike,
          },
          {
            key: 'manage_users',
            label: 'Manage Users',
            enabled: isAdminLike || hasUserManagementPermission,
          },
          {
            key: 'manage_vendors',
            label: 'Manage Vendors',
            enabled: isAdminLike || normalizedPermissions.users.vendor,
          },
        ],
      },
      quickActions: {
        funds: isAdminLike || normalizedPermissions.funds,
        bills: isAdminLike || normalizedPermissions.bills,
        attendance: isAdminLike || normalizedPermissions.attendance,
        bankAccounts: isAdminLike || normalizedPermissions.bankAccountManagement,
        salary: isAdmin || normalizedPermissions.salary,
      },
    };
  }

  async updateUserByAdmin(userId: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.userModel.findById(userId).exec();
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const updatePayload: Record<string, unknown> = {};

    if (updateUserDto.fullname !== undefined) {
      updatePayload.fullname = updateUserDto.fullname;
    }

    if (updateUserDto.email !== undefined) {
      updatePayload.email = this.normalizeEmail(updateUserDto.email);
    }

    if (updateUserDto.password !== undefined) {
      updatePayload.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (updateUserDto.role !== undefined) {
      if (updateUserDto.role === UserRole.ADMIN) {
        throw new BadRequestException('Admin role cannot be assigned');
      }

      updatePayload.role = updateUserDto.role;
      if (existingUser.role !== updateUserDto.role) {
        updatePayload.specialIndex = await this.generateUniqueSpecialIndex(updateUserDto.role);
      }
    }

    if (updateUserDto.phonenumber !== undefined) {
      updatePayload.phonenumber = updateUserDto.phonenumber;
    }

    if (updateUserDto.salary !== undefined) {
      updatePayload.salary = updateUserDto.salary;
    }

    if (updateUserDto.salaryCycle !== undefined) {
      updatePayload.salaryCycle = updateUserDto.salaryCycle;
    }

    if (updateUserDto.openingbalance !== undefined) {
      updatePayload.openingbalance = updateUserDto.openingbalance;
    }

    if (updateUserDto.addressDetails !== undefined) {
      const mergedAddressDetails = this.mergeAddressDetails(
        existingUser.addressDetails as UserAddressDetails,
        updateUserDto.addressDetails,
      );
      updatePayload.addressDetails = mergedAddressDetails;

      if (updateUserDto.pincode === undefined && mergedAddressDetails.pincode !== undefined) {
        updatePayload.pincode = mergedAddressDetails.pincode;
      }

      if (updateUserDto.address === undefined) {
        const composedAddress = this.composeAddressFromDetails(mergedAddressDetails);
        if (composedAddress) {
          updatePayload.address = composedAddress;
        }
      }
    }

    if (updateUserDto.pincode !== undefined) {
      updatePayload.pincode = updateUserDto.pincode;
      const addressDetails =
        (updatePayload.addressDetails as UserAddressDetails | undefined) ??
        this.normalizeAddressDetails(existingUser.addressDetails as UserAddressDetails);
      updatePayload.addressDetails = {
        ...addressDetails,
        pincode: updateUserDto.pincode,
      };
    }

    if (updateUserDto.address !== undefined) {
      updatePayload.address = updateUserDto.address;
    }

    if (updateUserDto.bloodgroup !== undefined) {
      updatePayload.bloodgroup = updateUserDto.bloodgroup;
    }

    if (updateUserDto.profilepicture !== undefined) {
      updatePayload.profilepicture = updateUserDto.profilepicture;
    }

    if (updateUserDto.faceRecognitionEnabled !== undefined) {
      updatePayload.faceRecognitionEnabled = updateUserDto.faceRecognitionEnabled;
    }

    if (updateUserDto.faceRecognitionImage !== undefined) {
      updatePayload.faceRecognitionImage = updateUserDto.faceRecognitionImage;
    }

    if (updateUserDto.emergencyContact !== undefined) {
      updatePayload.emergencyContact = this.mergeEmergencyContact(
        existingUser.emergencyContact as UserEmergencyContact,
        updateUserDto.emergencyContact,
      );
    }

    if (updateUserDto.permissions !== undefined) {
      updatePayload.permissions = this.mergePermissions(
        existingUser.permissions as UserPermissions,
        updateUserDto.permissions,
      );
    }

    if (Object.keys(updatePayload).length === 0) {
      return this.sanitizeUser(existingUser.toObject());
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, updatePayload, { returnDocument: 'after', runValidators: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(updatedUser.toObject());
  }

  async deleteUserByAdmin(userId: string) {
    const deletedUser = await this.userModel.findByIdAndDelete(userId).lean().exec();

    if (!deletedUser) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User deleted successfully',
      user: this.sanitizeUser(deletedUser),
    };
  }

  async updatePassword(email: string, hashedPassword: string) {
    return this.userModel
      .updateOne({ email: this.normalizeEmail(email) }, { password: hashedPassword })
      .exec();
  }
}
