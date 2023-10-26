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
  match,
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

$update;
export function createUser(payload: UserPayload): Result<User, string> {
  const user: User = {
    id: uuidv4(),
    createdAt: ic.time(),
    updatedAt: Opt.None,
    ...payload,
  };

  userStorage.insert(user.id, user);
  return Result.Ok<User, string>(user);
}


$query;
export function getUser(id: string): Result<User, string> {
  return match(userStorage.get(id), {
    Some: (user) => Result.Ok<User, string>(user),
    None: () => Result.Err<User, string>(`User with ID=${id} not found.`),
  });
}

 $query;
export function getAllUsers(): Result<Vec<User>, string> {
  return Result.Ok(userStorage.values());
}

$update;
export function updateUser(id: string, payload: UserPayload): Result<User, string> {
  return match(userStorage.get(id), {
    Some: (existingUser) => {
      const updatedUser: User = {
        ...existingUser,
        ...payload,
        updatedAt: Opt.Some(ic.time()),
      };

      userStorage.insert(updatedUser.id, updatedUser);
      return Result.Ok<User, string>(updatedUser);
    },
    None: () => Result.Err<User, string>(`User with ID=${id} not found.`),
  });
}

 $update;
export function deleteUser(id: string): Result<User, string> {
  return match(userStorage.get(id), {
    Some: (existingUser) => {
      userStorage.remove(id);
      return Result.Ok<User, string>(existingUser);
    },
    None: () => Result.Err<User, string>(`User with ID=${id} not found.`),
  });
}

   $update;
export function createHealthRecord(payload: HealthRecordPayload): Result<HealthRecord, string> {
  const healthRecord: HealthRecord = {
    id: uuidv4(),
    createdAt: ic.time(),
    updatedAt: Opt.None,
    ...payload,
  };

  healthRecordStorage.insert(healthRecord.id, healthRecord);
  return Result.Ok<HealthRecord, string>(healthRecord);
}

 $query;
export function getHealthRecord(id: string): Result<HealthRecord, string> {
  return match(healthRecordStorage.get(id), {
    Some: (healthRecord) => Result.Ok<HealthRecord, string>(healthRecord),
    None: () => Result.Err<HealthRecord, string>(`HealthRecord with ID=${id} not found.`),
  });
}

$query;
export function getHealthRecordsForUser(userId: string): Result<Vec<HealthRecord>, string> {
  const userHealthRecords = healthRecordStorage.values().filter((record) => record.userId === userId);
  return Result.Ok(userHealthRecords);
}

$update;
export function updateHealthRecord(id: string, payload: HealthRecordPayload): Result<HealthRecord, string> {
  return match(healthRecordStorage.get(id), {
    Some: (existingRecord) => {
      const updatedRecord: HealthRecord = {
        ...existingRecord,
        ...payload,
        updatedAt: Opt.Some(ic.time()),
      };

      healthRecordStorage.insert(updatedRecord.id, updatedRecord);
      return Result.Ok<HealthRecord, string>(updatedRecord);
    },
    None: () => Result.Err<HealthRecord, string>(`HealthRecord with ID=${id} not found.`),
  });
}

$update;
export function deleteHealthRecord(id: string): Result<HealthRecord, string> {
  return match(healthRecordStorage.get(id), {
    Some: (existingRecord) => {
      healthRecordStorage.remove(id);
      return Result.Ok<HealthRecord, string>(existingRecord);
    },
    None: () => Result.Err<HealthRecord, string>(`HealthRecord with ID=${id} not found.`),
  });
}


globalThis.crypto = {
  //@ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};

