const mysql = require('mysql2/promise');

const config = {
  host: '127.0.0.1',
  user: 'root',
  password: 'Bebxar-jehreh-6recro',
  database: 'guide_app',
};

async function createConnection() {
    return await mysql.createConnection(config);
}


// Temporary Update Problem Simulation
async function temporaryUpdateProblem() {
    const recordId = 1;
  
    async function problematicUpdate() {
      const connection = await createConnection();
      try {
        await connection.beginTransaction();
        await connection.query('UPDATE guide SET name = "Temp Update" WHERE id = ?', [recordId]);
        // Simulate a problem by waiting before rollback
        await new Promise(resolve => setTimeout(resolve, 2000));
        throw new Error("Simulated failure");
      } catch (error) {
        await connection.rollback();
        console.error("Rollback after temporary update", error);
      } finally {
        await connection.end();
      }
    }
  
    async function readDuringUpdate() {
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait to ensure the update occurs first
      const connection = await createConnection();
      try {
        const [rows] = await connection.query('SELECT * FROM guide WHERE id = ?', [recordId]);
        console.log("Read during temporary update:", rows);
      } finally {
        await connection.end();
      }
    }
  
    await Promise.all([problematicUpdate(), readDuringUpdate()]);
  }


  // Incorrect Summary Problem Simulation
async function incorrectSummaryProblem() {
    const connection = await createConnection();
    try {
      await connection.beginTransaction();
  
      const [initialSum] = await connection.query('SELECT SUM(age) as total FROM guide');
      console.log("Initial sum:", initialSum[0].total);
  
      // Another transaction updates a value during the calculation
      setTimeout(async () => {
        const conn = await createConnection();
        await conn.query('UPDATE guide SET age = age + 1 WHERE id = 1');
        await conn.end();
      }, 500);
  
      // Wait to simulate the time taken to calculate
      await new Promise(resolve => setTimeout(resolve, 1000));
  
      const [finalSum] = await connection.query('SELECT SUM(age) as total FROM guide');
      console.log("Final sum after update:", finalSum[0].total);
  
      await connection.commit();
    } finally {
      await connection.end();
    }
  }

  
  async function lostUpdateProblem() {
    const recordId = 1;
  
    try {
      const results = await Promise.all([updateLost1(recordId), updateLost2(recordId)]);
      results.forEach(result => console.log(result));
    } catch (error) {
      console.error('Lost update problem encountered an error:', error);
    }
  }
  
  async function updateLost1(recordId) {
    const connection = await createConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query('SELECT * FROM guide WHERE id = ?', [recordId]);
      const newName = rows[0].name + " 1";
      await connection.query('UPDATE guide SET name = ? WHERE id = ?', [newName, recordId]);
      await connection.commit();
      return `First update successful: ${newName}`;
    } catch (error) {
      await connection.rollback();
      throw error; // Rethrow after rollback to be caught in the calling function
    } finally {
      await connection.end();
    }
  }
  
  async function updateLost2(recordId) {
    const connection = await createConnection();
    try {
        // Move the isolation level setting here, before beginning the transaction
        await connection.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");

        await connection.beginTransaction();
        const [rows] = await connection.query('SELECT * FROM guide WHERE id =?', [recordId]);
        const newName = rows[0].Name + " 2";  // Ensure the field name 'Name' is correctly capitalized as per your schema
        await connection.query('UPDATE guide SET Name =? WHERE id =?', [newName, recordId]);
        await connection.commit();
        return `Second update successful: ${newName}`;
    } catch (error) {
        await connection.rollback();
        throw error;  // Rethrow the error after rollback to ensure it can be caught and handled outside this function
    } finally {
        await connection.end();
    }
}


  

  // Unrepeatable Read Problem Simulation
async function unrepeatableReadProblem() {
    const recordId = 1;
    const connection = await createConnection();
    try {
      await connection.beginTransaction();
      const [rows1] = await connection.query('SELECT * FROM guide WHERE id = ?', [recordId]);
      console.log("First read:", rows1[0]);
  
      // Another transaction updates the row
      setTimeout(async () => {
        const conn = await createConnection();
        await conn.query('UPDATE guide SET name = "Changed Name" WHERE id = ?', [recordId]);
        await conn.end();
      }, 500);
  
      // Wait before reading again
      await new Promise(resolve => setTimeout(resolve, 1000));
  
      const [rows2] = await connection.query('SELECT * FROM guide WHERE id = ?', [recordId]);
      console.log("Second read after update:", rows2[0]);
  
      await connection.commit();
    } finally {
      await connection.end();
    }
  }
  


  // Phantom Read Problem Simulation
async function phantomReadProblem() {
    const connection = await createConnection();
    try {
      await connection.beginTransaction();
  
      const [rows1] = await connection.query('SELECT * FROM guide WHERE age > 10');
      console.log("Initial read:", rows1.length);
  
      // Another transaction adds a new row that meets the condition
      setTimeout(async () => {
        const conn = await createConnection();
        await conn.query('INSERT INTO guide (name, age) VALUES ("New Entry", 15)');
        await conn.end();
      }, 500);
  
      // Wait before reading again
      await new Promise(resolve => setTimeout(resolve, 1000));
  
      const [rows2] = await connection.query('SELECT * FROM guide WHERE age > 10');
      console.log("Second read after insert:", rows2.length);
  
      await connection.commit();
    } finally {
      await connection.end();
    }
  }




// Example usage to demonstrate concurrency problems
async function main() {
    console.log("Starting Temporary Update Problem Simulation...");
    await temporaryUpdateProblem();
    console.log("Temporary Update Problem Simulation Completed.");
  
    console.log();

    console.log("Starting Incorrect Summary Problem Simulation...");
    await incorrectSummaryProblem();
    console.log("Incorrect Summary Problem Simulation Completed.");

    console.log();
  
    console.log("Starting Lost Update Problem Simulation...");
    await lostUpdateProblem();
    console.log("Lost Update Problem Simulation Completed.");

    console.log();
  
    console.log("Starting Unrepeatable Read Problem Simulation...");
    await unrepeatableReadProblem();
    console.log("Unrepeatable Read Problem Simulation Completed.");

    console.log();
  
    console.log("Starting Phantom Read Problem Simulation...");
    await phantomReadProblem();
    console.log("Phantom Read Problem Simulation Completed.");
  }
  
  main().catch(console.error);
  