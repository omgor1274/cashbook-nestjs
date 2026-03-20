import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, Types } from 'mongoose';
import { UserRole } from '../user/user.enum';
import { User, Userdocument } from '../user/schemas/user.schema';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import {
  QueryAttendanceDto,
  SearchAttendanceWorkersDto,
} from './dto/query-attendance.dto';
import { AttendanceStatus, AttendanceUnit } from './attendance.enums';
import { Attendance, AttendanceDocument } from './schemas/attendance.schema';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<AttendanceDocument>,
    @InjectModel(User.name) private readonly userModel: Model<Userdocument>,
  ) {}

  private normalizeStartOfDay(value: Date): Date {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private normalizeEndOfDay(value: Date): Date {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async searchWorkers(searchDto: SearchAttendanceWorkersDto) {
    const limit = searchDto.limit ?? 20;
    const query = searchDto.query?.trim();
    const filter: any = { role: UserRole.WORKER };

    if (query) {
      const regex = new RegExp(this.escapeRegex(query), 'i');
      filter.$or = [{ fullname: regex }, { specialIndex: regex }];
    }

    return this.userModel
      .find(filter)
      .select('_id fullname specialIndex profilepicture')
      .sort({ specialIndex: 1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async markAttendance(markAttendanceDto: MarkAttendanceDto, markedBy: string) {
    const attendanceDate = this.normalizeStartOfDay(
      new Date(markAttendanceDto.attendanceDate),
    );

    if (markAttendanceDto.entries.length === 0) {
      throw new BadRequestException(
        'At least one attendance entry is required',
      );
    }

    const latestEntryMap = new Map<
      string,
      (typeof markAttendanceDto.entries)[number]
    >();
    for (const entry of markAttendanceDto.entries) {
      latestEntryMap.set(entry.workerId, entry);
    }

    const workerIds = Array.from(latestEntryMap.keys());
    const workersCount = await this.userModel
      .countDocuments({
        _id: { $in: workerIds.map((id) => new Types.ObjectId(id)) },
        role: UserRole.WORKER,
      })
      .exec();

    if (workersCount !== workerIds.length) {
      throw new BadRequestException('One or more worker IDs are invalid');
    }

    const operations = Array.from(latestEntryMap.values()).map((entry) => ({
      updateOne: {
        filter: {
          attendanceDate,
          workerId: new Types.ObjectId(entry.workerId),
        },
        update: {
          $set: {
            units: entry.units,
            status:
              entry.units === AttendanceUnit.ZERO
                ? AttendanceStatus.ABSENT
                : AttendanceStatus.PRESENT,
            project: entry.project?.trim() ?? '',
            location: entry.location?.trim() ?? '',
            note: entry.note?.trim() ?? '',
            markedBy: new Types.ObjectId(markedBy),
          },
          $setOnInsert: {
            attendanceDate,
            workerId: new Types.ObjectId(entry.workerId),
          },
        },
        upsert: true,
      },
    }));

    const result = await this.attendanceModel.bulkWrite(operations);

    return {
      message: 'Attendance marked successfully',
      date: attendanceDate,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
    };
  }

  async findAttendanceByDate(queryDto: QueryAttendanceDto) {
    const page = queryDto.page ?? 1;
    const limit = queryDto.limit ?? 20;
    const skip = (page - 1) * limit;

    const date = queryDto.attendanceDate
      ? this.normalizeStartOfDay(new Date(queryDto.attendanceDate))
      : this.normalizeStartOfDay(new Date());

    const filter: QueryFilter<AttendanceDocument> = {
      attendanceDate: {
        $gte: date,
        $lte: this.normalizeEndOfDay(date),
      },
    };

    if (queryDto.query?.trim()) {
      const regex = new RegExp(this.escapeRegex(queryDto.query.trim()), 'i');
      const workerIds = await this.userModel
        .find({
          role: UserRole.WORKER,
          $or: [{ fullname: regex }, { specialIndex: regex }],
        })
        .distinct('_id')
        .exec();

      filter.workerId = { $in: workerIds };
    }

    const [items, total, presentCount, absentCount] = await Promise.all([
      this.attendanceModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('workerId', 'fullname specialIndex profilepicture')
        .populate('markedBy', 'fullname specialIndex')
        .lean()
        .exec(),
      this.attendanceModel.countDocuments(filter).exec(),
      this.attendanceModel
        .countDocuments({ ...filter, status: AttendanceStatus.PRESENT })
        .exec(),
      this.attendanceModel
        .countDocuments({ ...filter, status: AttendanceStatus.ABSENT })
        .exec(),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      summary: {
        presentCount,
        absentCount,
      },
    };
  }

  async deleteAttendanceById(attendanceId: string) {
    const deletedAttendance = await this.attendanceModel
      .findByIdAndDelete(attendanceId)
      .lean()
      .exec();

    if (!deletedAttendance) {
      throw new NotFoundException('Attendance record not found');
    }

    return {
      message: 'Attendance record removed successfully',
      attendance: deletedAttendance,
    };
  }
}
