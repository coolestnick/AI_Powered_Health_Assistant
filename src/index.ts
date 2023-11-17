// Import necessary modules
import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from "azle";
import { v4 as uuidv4 } from "uuid";

// Define the User record structure
type User = Record<{
  id: string;
  name: string;
  age: number;
  location: string;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

// Define the payload for creating a new User record
type UserPayload = Record<{
  name: string;
  age: number;
  location: string;
}>;

// Define the HealthRecord record structure
type HealthRecord = Record<{
  id: string;
  userId: string;
  allergies: Vec<string>;
  conditions: Vec<string>;
  medications: Vec<string>;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

// Define the payload for creating a new HealthRecord
type HealthRecordPayload = Record<{
  userId: string;
  allergies: Vec<string>;
  conditions: Vec<string>;
  medications: Vec<string>;
}>;

// Define a storage container for health records
const healthRecordStorage = new StableBTreeMap<string, HealthRecord>(1, 44, 1024);

// Define a storage container for users
const userStorage = new StableBTreeMap<string, User>(0, 44, 1024);

// Function to create a new User record
$update;
export function createUser(payload: UserPayload): Result<User, string> {
  if (!payload.name || !payload.age || !payload.location) {
    // Validation: Check if required fields in the payload are missing
    return Result.Err<User, string>("Missing required fields in payload");
  }

  if (payload.age <= 0) {
    // Validation: Check if age is greater than zero
    return Result.Err<User, string>("Age must be greater than zero.");
  }

  // Create a new User object
  const user: User = {
    id: uuidv4(),
    createdAt: ic.time(),
    updatedAt: Opt.None,
    name: payload.name,
    age: payload.age,
    location: payload.location

  };

  try {
    // Insert the new User record into storage
    userStorage.insert(user.id, user);
  } catch (error) {
    return Result.Err<User, string>("Error occurred during user insertion");
  }

  return Result.Ok<User, string>(user);
}

// Function to retrieve a User by its ID
$query;
export function getUser(id: string): Result<User, string> {
  if (!id) {
    // Validation: Check if ID is invalid or missing
    return Result.Err<User, string>(`Invalid id=${id}.`);
  }
  try {
    return match(userStorage.get(id), {
      Some: (user) => Result.Ok<User, string>(user),
      None: () => Result.Err<User, string>(`User with id=${id} not found.`),
    });

  } catch (error) {
    return Result.Err<User, string>(`Error while retrieving user with id ${id}`);
  }
}

// Function to retrieve all Users
$query;
export function getAllUsers(): Result<Vec<User>, string> {
  try {
    return Result.Ok(userStorage.values());
  } catch (error) {
    return Result.Err(`Failed to get all users: ${error}`);
  }
}

// Function to update a User record
$update;
export function updateUser(id: string, payload: UserPayload): Result<User, string> {
  if (!id) {
    // Validation: Check if ID is invalid or missing
    return Result.Err<User, string>('Invalid id.');
  }

  if (!payload.name || !payload.age || !payload.location) {
    // Validation: Check if required fields in the payload are missing
    return Result.Err<User, string>('Missing required fields in payload.');
  }

  return match(userStorage.get(id), {
    Some: (existingUser) => {
      // Create an updated User object
      const updatedUser: User = {
        id: existingUser.id,
        name: payload.name,
        age: payload.age,
        location: payload.location,
        createdAt: ic.time(),
        updatedAt: Opt.Some(ic.time()),
      };

      try {
        // Update the User record in storage
        userStorage.insert(updatedUser.id, updatedUser);
        return Result.Ok<User, string>(updatedUser);
      } catch (error) {
        return Result.Err<User, string>(`Error updating user: ${error}`);
      }
    },

    None: () => Result.Err<User, string>(`User with id=${id} not found.`),
  });
}

// Function to delete a User by its ID
$update;
export function deleteUser(id: string): Result<User, string> {
  if (!id) {
    // Validation: Check if ID is invalid or missing
    return Result.Err<User, string>(`Invalid id=${id}.`);
  }
  try {
    return match(userStorage.get(id), {
      Some: (existingUser) => {
        // Remove the User from storage
        userStorage.remove(id);
        return Result.Ok<User, string>(existingUser);
      },
      None: () => Result.Err<User, string>(`User with id=${id} not found.`),
    });
  } catch (error) {
    return Result.Err<User, string>(`Error deleting user with id=${id}: ${error}`);
  }
}


// Function to create a new HealthRecord
$update;
export function createHealthRecord(payload: HealthRecordPayload): Result<HealthRecord, string> {
  if (!payload.userId) {
    // Validation: Check if required fields in the payload are missing
    return Result.Err<HealthRecord, string>("Missing required fields in payload");
  }

  // Create a new HealthRecord object
  const healthRecord: HealthRecord = {
    id: uuidv4(),
    createdAt: ic.time(),
    updatedAt: Opt.None,
    userId: payload.userId,
    allergies: payload.allergies,
    conditions: payload.conditions,
    medications: payload.medications

  };

  try {
    // Insert the new HealthRecord into storage
    healthRecordStorage.insert(healthRecord.id, healthRecord);
  } catch (error) {
    return Result.Err<HealthRecord, string>("Error occurred during health record insertion");
  }

  return Result.Ok<HealthRecord, string>(healthRecord);
}

// Function to retrieve a HealthRecord by its ID
$query;
export function getHealthRecord(id: string): Result<HealthRecord, string> {
  if (!id) {
    // Validation: Check if ID is invalid or missing
    return Result.Err<HealthRecord, string>(`Invalid id=${id}.`);
  }
  try {
    return match(healthRecordStorage.get(id), {
      Some: (healthRecord) => Result.Ok<HealthRecord, string>(healthRecord),
      None: () => Result.Err<HealthRecord, string>(`HealthRecord with id=${id} not found.`),
    });

  } catch (error) {
    return Result.Err<HealthRecord, string>(`Error while retrieving health record with id ${id}`);
  }
}

// Function to retrieve all HealthRecords for a user
$query;
export function getHealthRecordsForUser(userId: string): Result<Vec<HealthRecord>, string> {
  try {
    const userHealthRecords = healthRecordStorage.values().filter((record) => record.userId === userId);
    return Result.Ok(userHealthRecords);
  } catch (error) {
    return Result.Err(`Failed to get health records for user: ${error}`);
  }
}

// Function to update a HealthRecord
$update;
export function updateHealthRecord(id: string, payload: HealthRecordPayload): Result<HealthRecord, string> {
  if (!id) {
    // Validation: Check if ID is invalid or missing
    return Result.Err<HealthRecord, string>('Invalid id.');
  }

  if (!payload.userId) {
    // Validation: Check if required fields in the payload are missing
    return Result.Err<HealthRecord, string>('Missing required fields in payload.');
  }

  return match(healthRecordStorage.get(id), {
    Some: (existingRecord) => {
      // Create an updated HealthRecord object
      const updatedRecord: HealthRecord = {
        id: existingRecord.id,
        ...payload,
        createdAt: ic.time(),
        updatedAt: Opt.Some(ic.time()),
      };

      try {
        // Update the HealthRecord in storage
        healthRecordStorage.insert(updatedRecord.id, updatedRecord);
        return Result.Ok<HealthRecord, string>(updatedRecord);
      } catch (error) {
        return Result.Err<HealthRecord, string>(`Error updating health record: ${error}`);
      }
    },

    None: () => Result.Err<HealthRecord, string>(`HealthRecord with id=${id} not found.`),
  });
}

// Function to delete a HealthRecord by its ID
$update;
export function deleteHealthRecord(id: string): Result<HealthRecord, string> {
  if (!id) {
    // Validation: Check if ID is invalid or missing
    return Result.Err<HealthRecord, string>(`Invalid id=${id}.`);
  }
  try {
    return match(healthRecordStorage.get(id), {
      Some: (existingRecord) => {
        // Remove the HealthRecord from storage
        healthRecordStorage.remove(id);
        return Result.Ok<HealthRecord, string>(existingRecord);
      },
      None: () => Result.Err<HealthRecord, string>(`HealthRecord with id=${id} not found.`),
    });
  } catch (error) {
    return Result.Err<HealthRecord, string>(`Error deleting health record with id=${id}: ${error}`);
  }
}


// Set up a random number generator for generating UUIDs
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

