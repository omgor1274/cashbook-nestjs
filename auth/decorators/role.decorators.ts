import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/user/user.enum';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
