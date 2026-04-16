/**
 * Database lab — queries.js
 * ---------------------
 * Standalone script: connect to the same DB, run example aggregate SELECTs.
 * Run after you have submitted at least one CV via the web form:
 *   node queries.js
 *   npm run queries
 */

const { connectDb, getPool } = require('./db');

async function runQueries() {
  await connectDb();
  const pool = getPool();

  // —— QUERY 0: Database previes)
  console.log('\n── QUERY 0: Database previes ──');

  const [prev] = await pool.query(`
      SELECT *
      FROM person p
    `);

  prev.forEach(row =>
    console.log(`  ${row.fName} ${row.lName} → ${row.idperson}, ${row.country} `)
  );

  // —— QUERY 1: COUNT — how many courses per person (LEFT JOIN keeps people with 0 courses)
  console.log('\n── QUERY 1: Number of courses per person ──');

  const [courseCounts] = await pool.query(`
      SELECT p.fName, p.lName, COUNT(c.idcourse) AS courseCount
      FROM person p
      LEFT JOIN course c ON c.person_idperson = p.idperson
      GROUP BY p.idperson
      ORDER BY courseCount DESC
    `);

  courseCounts.forEach(row =>
    console.log(`  ${row.fName} ${row.lName} → ${row.courseCount} course(s)`)
  );

  // —— QUERY 2: only persons with more than 1 project
  console.log('\n── QUERY 2: Persons with more than 1 project ──');

  const [topPerson] = await pool.query(`
      SELECT p.fName, p.lName, COUNT(pr.idproject) AS projectCount
      FROM person p
      INNER JOIN project pr ON pr.person_idperson = p.idperson
      GROUP BY p.idperson
      HAVING projectCount > 1
      ORDER BY projectCount DESC
    `);

  if (topPerson.length > 0) {
    topPerson.forEach(t =>
      console.log(`  ${t.fName} ${t.lName} — ${t.projectCount} project(s)`)
    );
  } else {
    console.log('  No data yet.');
  }

  // —— QUERY 3: DISTINCT — list unique countries in person table
  console.log('\n── QUERY 3: Unique countries ──');

  const [distinctCountries] = await pool.query(`
      SELECT DISTINCT country
      FROM person
      ORDER BY country ASC
    `);

  distinctCountries.forEach(row =>
    console.log(`  ${row.country || 'N/A'}`)
  );

  // —— QUERY 4: DELETE — remove persons with no city set
  // console.log('\n── QUERY 4: Delete persons with no city ──');

  // const [deleteResult] = await pool.query(`
  //   DELETE FROM person
  //   WHERE city IS NULL OR city = ''
  // `);

  // console.log(`  Deleted ${deleteResult.affectedRows} person(s) with no city.`);

  // —— QUERY 5: UPDATE — update email for person with id = 1
  console.log('\n── QUERY 5: Update email for person with id = 1 ──');

  const [updateResult] = await pool.query(`
    UPDATE person p SET p.email = 'test@updated.com' where p.idperson = 1 ;
  `);
  console.log(`  Updated ${updateResult.affectedRows} person(s) email(s).`);


  // ======================================== TASK =============================================================
  // 1- Show persons who are enrolled in more than 2 courses, display their full name and course count
  console.log('\n── QUERY 6: Persons who are enrolled in more than 2 courses ──');

  const [goodStudents] = await pool.query(`
    SELECT 
      ( SELECT CONCAT(fName, ' ', lName)
        FROM person 
        WHERE idperson = pr.idperson
      ) AS fullName, COUNT(*) as courses
    FROM person pr JOIN course c ON pr.idperson = c.person_idperson
    GROUP BY idperson
    HAVING COUNT(*) > 2;
  `);

  goodStudents.forEach(row =>
    console.log(`  ${row.fullName} -> ${row.courses}`)
  );

  // 2- list each distinct country and the number of persons in it, only show countries with more than 2 persons
  console.log('\n── QUERY 7: Distinct country and the number of persons in it greater than 2 ──');

  const [bigCountries] = await pool.query(`
    SELECT country, COUNT(*) AS population
    FROM person
    GROUP BY country
    HAVING COUNT(*) > 2;
  `);

  bigCountries.forEach(row =>
    console.log(`  ${row.country} -> ${row.population}`)
  );

  // 3- Update the email of all persons who have at least one project, set it to their firstName + lastName + '@company.com
  console.log('\n── QUERY 8: Update the email of all persons who have at least one project ──');

  const [updatedEmails] = await pool.query(`
    UPDATE person p
    JOIN project prj ON p.idperson = prj.person_idperson
    SET p.email = CONCAT(p.fName, p.lName, '@company.com');
  `);

 console.log(`  Updated ${updatedEmails.affectedRows} person(s) email(s).`);

  // 4- Delete all courses that belong to persons from a specific country
  console.log('\n── QUERY 9: Delete all courses that belong to persons from a specific country ──');

  const [deletedOnCountries] = await pool.query(`
    DELETE c 
    FROM course c 
      JOIN person p ON p.idperson = c.person_idperson
    WHERE country = 'Egypt'
  `);

 console.log(`  Deleted ${deletedOnCountries.affectedRows} course(s).`);

  // 5- Show each country and the average number of languages spoken by persons from that country,
  // only show countries where the average is more than 1

  console.log('\n── QUERY 10: Show each country and the average number of languages spoken > 1 ──');
  const[popularCountry] = await pool.query(`
    WITH helper AS (
      SELECT p.country, p.idperson, COUNT(*) AS languages
      FROM person p LEFT JOIN language l ON p.idperson = l.person_idperson
      GROUP BY p.country, p.idperson
    )
    SELECT country, AVG(languages) AS average
    FROM helper
    GROUP BY country
    HAVING AVG(languages) > 1
  `);

  popularCountry.forEach(row =>
    console.log(`  ${row.country} -> ${row.average}`)
  );

  await pool.end();
}

runQueries().catch(err => console.error('Error:', err.message));