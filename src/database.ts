import { DatabaseSync } from 'node:sqlite';
import { hashPassword } from './crypto.ts';

const db = new DatabaseSync(':memory:');
const hashedAdminPassword = hashPassword('admin');

db.exec(`
  CREATE TABLE users (
    name TEXT PRIMARY KEY,
    password TEXT
  );
`);

try {
  db.exec(`
    INSERT INTO users (name, password) VALUES ('admin', '${hashedAdminPassword}');
  `);
  
} catch (error) {
  if (error.message.includes('UNIQUE constraint failed')) {
    console.log('Admin user already exists');
  } else {
    throw error;
  }
  
}

export function isValidUser(username: string, password: string): boolean {
  const user = db.prepare('SELECT * FROM users WHERE name = ? AND password = ?').get(username, password);
  return !!user;
}



