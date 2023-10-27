import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  Result,
  nat64,
  ic,
  Opt,
  Principal,
} from "azle";
import { v4 as uuidv4 } from "uuid";

type User = Record<{
  id: string;
  name: string;
  age: number;
  location: string;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

type HealthRecord = Record<{
  id: string;
  userId: string;
  allergies: Vec<string>;
  conditions: Vec<string>;
  medications: Vec<string>;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

type UserPayload = Record<{
  name: string;
  age: number;
  location: string;
}>;

type HealthRecordPayload = Record<{
  userId: string;
  allergies: Vec<string>;
  conditions: Vec<string>;
  medications: Vec<string>;
}>;

const userStorage = new StableBTreeMap<string, User>(0, 44, 1024);
const healthRecordStorage = new StableBTreeMap<string, HealthRecord>(1, 44, 1024);

function generateUUID(): string {
  return uuidv4();
}

function getCurrentTime(): nat64 {
  return ic.time();
}

function validateUserPayload(payload: UserPayload): Result<void, string> {
  // Add validation logic here
  if (!payload.name || !payload.age || payload.age < 0) {
    return Result.Err("Invalid user payload.");
  }
  return Result.Ok(undefined);
}

function validateHealthRecordPayload(payload: HealthRecordPayload): Result<void, string> {
  // Add validation logic here
  if (!payload.userId) {
    return Result.Err("Invalid health record payload.");
  }
  return Result.Ok(undefined);
}

function authenticateUser(principal: Principal): Result<void, string> {
  // Add authentication logic here
  if (/* User is authenticated */) {
    return Result.Ok(undefined);
  }
  return Result.Err("Authentication failed.");
}

$update;
export function createUser(payload: UserPayload, principal: Principal): Result<User, string> {
  const validation = validateUserPayload(payload);
  if (validation.isErr()) {
    return validation;
  }

  const authentication = authenticateUser(principal);
  if (authentication.isErr()) {
    return authentication;
  }

  const user: User = {
    id: generateUUID(),
    createdAt: getCurrentTime(),
    updatedAt: Opt.None,
    ...payload,
  };

  userStorage.insert(user.id, user);
  return Result.Ok<User, string>(user);
}

$query;
export function getUser(id: string, principal: Principal): Result<User, string> {
  const authentication = authenticateUser(principal);
  if (authentication.isErr()) {
    return authentication;
  }

  const user = userStorage.get(id);
  if (user === null) {
    return Result.Err(`User with ID=${id} not found.`);
  }

  return Result.Ok(user);
}

$query;
export function getAllUsers(principal: Principal): Result<Vec<User>, string> {
  const authentication = authenticateUser(principal);
  if (authentication.isErr()) {
    return authentication;
  }

  return Result.Ok(userStorage.values());
}

$update;
export function updateUser(id: string, payload: UserPayload, principal: Principal): Result<User, string> {
  const validation = validateUserPayload(payload);
  if (validation.isErr()) {
    return validation;
  }

  const authentication = authenticateUser(principal);
  if (authentication.isErr()) {
    return authentication;
  }

  const existingUser = userStorage.get(id);
  if (existingUser === null) {
    return Result.Err(`User with ID=${id} not found.`);
  }

  const updatedUser: User = {
    ...existingUser,
    ...payload,
    updatedAt: Opt.Some(getCurrentTime()),
  };

  userStorage.insert(updatedUser.id, updatedUser);
  return Result.Ok<User, string>(updatedUser);
}

$update;
export function deleteUser(id: string, principal: Principal): Result<User, string> {
  const authentication = authenticateUser(principal);
  if (authentication.isErr()) {
    return authentication;
  }

  const existingUser = userStorage.get(id);
  if (existingUser === null) {
    return Result.Err(`User with ID=${id} not found.`);
  }

  userStorage.remove(id);
  return Result.Ok<User, string>(existingUser);
}

$update;
export function createHealthRecord(payload: HealthRecordPayload, principal: Principal): Result<HealthRecord, string> {
  const validation = validateHealthRecordPayload(payload);
  if (validation.isErr()) {
    return validation;
  }

  const authentication = authenticateUser(principal);
  if (authentication.isErr()) {
    return authentication;
  }

  const healthRecord: HealthRecord = {
    id: generateUUID(),
    createdAt: getCurrentTime(),
    updatedAt: Opt.None,
    ...payload,
  };

  healthRecordStorage.insert(healthRecord.id, healthRecord);
  return Result.Ok<HealthRecord, string>(healthRecord);
}

$query;
export function getHealthRecord(id: string, principal: Principal): Result<HealthRecord, string> {
  const authentication = authenticateUser(principal);
  if (authentication.isErr()) {
    return authentication;
  }

  const healthRecord = healthRecordStorage.get(id);
  if (healthRecord === null) {
    return Result.Err(`HealthRecord with ID=${id} not found.`);
  }

  return Result.Ok(healthRecord);
}

$query;
export function getHealthRecordsForUser(userId: string, principal: Principal): Result<Vec<HealthRecord>, string> {
  const authentication = authenticateUser(principal);
  if (authentication.isErr()) {
    return authentication;
  }

  const userHealthRecords = healthRecordStorage.values().filter((record) => record.userId === userId);
  return Result.Ok(userHealthRecords);
}

$update;
export function updateHealthRecord(id: string, payload: HealthRecordPayload, principal: Principal): Result<HealthRecord, string> {
  const validation = validateHealthRecordPayload(payload);
  if (validation.isErr()) {
    return validation;
  }

  const authentication = authenticateUser(principal);
  if (authentication.isErr()) {
    return authentication;
  }

  const existingRecord = healthRecordStorage.get(id);
  if (existingRecord === null) {
    return Result.Err(`HealthRecord with ID=${id} not found.`);
  }

  const updatedRecord: HealthRecord = {
    ...existingRecord,
    ...payload,
    updatedAt: Opt.Some(getCurrentTime()),
  };

  healthRecordStorage.insert(updatedRecord.id, updatedRecord);
  return Result.Ok<HealthRecord, string>(updatedRecord);
}

$update;
export function deleteHealthRecord(id: string, principal: Principal): Result<HealthRecord, string> {
  const authentication = authenticateUser(principal);
  if (authentication.isErr()) {
    return authentication;
  }

  const existingRecord = healthRecordStorage.get(id);
  if (existingRecord === null) {
    return Result.Err(`HealthRecord with ID=${id} not found.`);
  }

  healthRecordStorage.remove(id);
  return Result.Ok<HealthRecord, string>(existingRecord);
}

// Placeholder authentication mechanism - replace with actual authentication logic
function authenticateUser(principal: Principal): Result<void, string> {
  if (principal.isAuthenticated) {
    return Result.Ok(undefined);
  }
  return Result.Err("Authentication failed.");
}
