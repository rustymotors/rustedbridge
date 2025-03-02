import { DatabaseSync } from 'node:sqlite';
import { hashPassword } from './crypto.ts';

const db = new DatabaseSync(':memory:');


db.exec(`
  CREATE TABLE users (
    name TEXT PRIMARY KEY,
    password TEXT
  );
`);

export function addUser(username: string, password: string): void {
  const hashedPassword = hashPassword(password, 16);
  db.exec(`
    INSERT INTO users (name, password) VALUES ('${username}', '${hashedPassword}');
  `);
}

export function isValidUser(username: string, password: string): boolean {
  const user = db.prepare('SELECT * FROM users WHERE name = ? AND password = ?').get(username, password);
  return !!user;
}



