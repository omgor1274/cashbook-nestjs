import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from '../user/dto/create.user.dto';
import { SalaryCycle } from '../user/profile.constants';
import { UserService } from '../user/user.service';
import { UserRole } from '../user/user.enum';

const DEFAULT_PASSWORD = 'dummy123';

const dummyUsers: CreateUserDto[] = [
  {
    fullname: 'Ishaan Admin',
    email: 'admin@dummy.local',
    password: DEFAULT_PASSWORD,
    role: UserRole.ADMIN,
    phonenumber: 9876543209,
    salary: 65000,
    salaryCycle: SalaryCycle.MONTHLY,
    openingbalance: 10000,
    pincode: 700001,
    address: '10 Park Street, Kolkata',
    bloodgroup: 'A-',
    profilepicture:
      'https://api.dicebear.com/9.x/initials/svg?seed=Ishaan%20Admin',
    faceRecognitionEnabled: false,
    addressDetails: {
      pincode: 700001,
      city: 'Kolkata',
      state: 'West Bengal',
      building: '10 Park Street',
      landmark: 'Near New Market',
    },
    emergencyContact: {
      fullname: 'Anaya Admin',
      phonenumber: 9876500010,
      relation: 'Spouse',
    },
    permissions: {
      bills: true,
      funds: true,
      attendance: true,
      users: {
        subAdmin: true,
        supervisor: true,
        worker: true,
        vendor: true,
      },
      salary: true,
      invoiceGeneration: true,
      bankAccountManagement: true,
    },
  },
  {
    fullname: 'Aarav Supervisor',
    email: 'supervisor@dummy.local',
    password: DEFAULT_PASSWORD,
    role: UserRole.SUPERVISOR,
    phonenumber: 9876543210,
    salary: 45000,
    salaryCycle: SalaryCycle.MONTHLY,
    openingbalance: 5000,
    pincode: 560001,
    address: '12 MG Road, Bengaluru',
    bloodgroup: 'B+',
    profilepicture:
      'https://api.dicebear.com/9.x/initials/svg?seed=Aarav%20Supervisor',
    faceRecognitionEnabled: false,
    addressDetails: {
      pincode: 560001,
      city: 'Bengaluru',
      state: 'Karnataka',
      building: '12 MG Road',
      landmark: 'Near Brigade Road',
    },
    emergencyContact: {
      fullname: 'Riya Supervisor',
      phonenumber: 9876500011,
      relation: 'Sister',
    },
    permissions: {
      bills: true,
      funds: true,
      attendance: true,
      users: {
        subAdmin: true,
        supervisor: true,
        worker: true,
        vendor: true,
      },
      salary: true,
      invoiceGeneration: true,
      bankAccountManagement: true,
    },
  },
  {
    fullname: 'Diya Sub Admin',
    email: 'subadmin@dummy.local',
    password: DEFAULT_PASSWORD,
    role: UserRole.SUB_ADMIN,
    phonenumber: 9876543211,
    salary: 38000,
    salaryCycle: SalaryCycle.MONTHLY,
    openingbalance: 3500,
    pincode: 400001,
    address: '18 Fort Street, Mumbai',
    bloodgroup: 'O+',
    profilepicture:
      'https://api.dicebear.com/9.x/initials/svg?seed=Diya%20Sub%20Admin',
    faceRecognitionEnabled: false,
    addressDetails: {
      pincode: 400001,
      city: 'Mumbai',
      state: 'Maharashtra',
      building: '18 Fort Street',
      landmark: 'Near CST',
    },
    emergencyContact: {
      fullname: 'Karan Admin',
      phonenumber: 9876500012,
      relation: 'Brother',
    },
    permissions: {
      bills: true,
      funds: true,
      attendance: true,
      users: {
        subAdmin: false,
        supervisor: true,
        worker: true,
        vendor: true,
      },
      salary: true,
      invoiceGeneration: true,
      bankAccountManagement: true,
    },
  },
  {
    fullname: 'Kabir Worker',
    email: 'worker1@dummy.local',
    password: DEFAULT_PASSWORD,
    role: UserRole.WORKER,
    phonenumber: 9876543212,
    salary: 22000,
    salaryCycle: SalaryCycle.MONTHLY,
    openingbalance: 1200,
    pincode: 110001,
    address: '44 Connaught Place, New Delhi',
    bloodgroup: 'A+',
    profilepicture:
      'https://api.dicebear.com/9.x/initials/svg?seed=Kabir%20Worker',
    faceRecognitionEnabled: false,
    addressDetails: {
      pincode: 110001,
      city: 'New Delhi',
      state: 'Delhi',
      building: '44 Connaught Place',
      landmark: 'Near Rajiv Chowk',
    },
    emergencyContact: {
      fullname: 'Pooja Worker',
      phonenumber: 9876500013,
      relation: 'Mother',
    },
  },
  {
    fullname: 'Meera Worker',
    email: 'worker2@dummy.local',
    password: DEFAULT_PASSWORD,
    role: UserRole.WORKER,
    phonenumber: 9876543213,
    salary: 21000,
    salaryCycle: SalaryCycle.MONTHLY,
    openingbalance: 900,
    pincode: 302001,
    address: '22 MI Road, Jaipur',
    bloodgroup: 'AB+',
    profilepicture:
      'https://api.dicebear.com/9.x/initials/svg?seed=Meera%20Worker',
    faceRecognitionEnabled: false,
    addressDetails: {
      pincode: 302001,
      city: 'Jaipur',
      state: 'Rajasthan',
      building: '22 MI Road',
      landmark: 'Near Ajmeri Gate',
    },
    emergencyContact: {
      fullname: 'Arjun Worker',
      phonenumber: 9876500014,
      relation: 'Father',
    },
  },
  {
    fullname: 'Vikram Vendor',
    email: 'vendor@dummy.local',
    password: DEFAULT_PASSWORD,
    role: UserRole.VENDOR,
    phonenumber: 9876543214,
    salary: 18000,
    salaryCycle: SalaryCycle.MONTHLY,
    openingbalance: 2500,
    pincode: 380001,
    address: '9 Relief Road, Ahmedabad',
    bloodgroup: 'O-',
    profilepicture:
      'https://api.dicebear.com/9.x/initials/svg?seed=Vikram%20Vendor',
    faceRecognitionEnabled: false,
    addressDetails: {
      pincode: 380001,
      city: 'Ahmedabad',
      state: 'Gujarat',
      building: '9 Relief Road',
      landmark: 'Near Lal Darwaza',
    },
    emergencyContact: {
      fullname: 'Neha Vendor',
      phonenumber: 9876500015,
      relation: 'Spouse',
    },
  },
];

async function seedDummyUsers() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const authService = app.get(AuthService);
    const userService = app.get(UserService);

    let createdCount = 0;
    let skippedCount = 0;

    for (const dummyUser of dummyUsers) {
      const existingUser = await userService.findByEmail(dummyUser.email);

      if (existingUser) {
        skippedCount++;
        const existingSpecialIndex = String(existingUser.specialIndex);
        console.log(
          `Skipped ${dummyUser.email} because it already exists as ${existingSpecialIndex}.`,
        );
        continue;
      }

      if (dummyUser.role === UserRole.ADMIN) {
        const hashedPassword = await bcrypt.hash(dummyUser.password, 10);
        const createdAdmin = await userService.createUser({
          ...dummyUser,
          password: hashedPassword,
        });
        createdCount++;
        const createdAdminEmail = String(createdAdmin.email);
        const createdAdminRole = String(createdAdmin.role);
        const createdAdminSpecialIndex = String(createdAdmin.specialIndex);
        console.log(
          `Created ${createdAdminEmail} with role ${createdAdminRole} and special index ${createdAdminSpecialIndex}.`,
        );
        continue;
      }

      const result = await authService.register({ ...dummyUser });
      createdCount++;
      const createdUser = result.user as {
        email: string;
        role: string;
        specialIndex: string;
      };
      console.log(
        `Created ${createdUser.email} with role ${createdUser.role} and special index ${createdUser.specialIndex}.`,
      );
    }

    console.log(
      `Dummy user seeding finished. Created: ${createdCount}, skipped: ${skippedCount}, default password: ${DEFAULT_PASSWORD}`,
    );
  } finally {
    await app.close();
  }
}

seedDummyUsers().catch((error: unknown) => {
  console.error('Dummy user seeding failed.');
  console.error(error);
  process.exitCode = 1;
});
