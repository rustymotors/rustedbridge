import * as bcrypt from 'bcryptjs';

export function hashPassword(password: string, salt: number): string {
  var hashed = bcrypt.hashSync(password, salt); // Hashing the password with the salt
  return hashed;
}

export function comparePassword(password: string, hashedPassword: string): boolean {
  return bcrypt.compareSync(password, hashedPassword);
}
