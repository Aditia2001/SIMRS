const pool = require("../config/db");

async function findAllRequests() {
  const result = await pool.query(`
    SELECT *
    FROM lab_requests
    ORDER BY created_at DESC
  `);

  return result.rows;
}

async function findRequestById(id) {
  const result = await pool.query(`SELECT * FROM lab_requests WHERE id = $1`, [
    id,
  ]);

  return result.rows[0] || null;
}

async function findResultsByRequestId(labRequestId) {
  const result = await pool.query(
    `SELECT * FROM lab_results WHERE lab_request_id = $1
     ORDER BY created_at DESC`,
    [labRequestId],
  );

  return result.rows;
}

async function createResult(data) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const requestResult = await client.query(
      `SELECT id, status
       FROM lab_requests
       WHERE id = $1
       FOR UPDATE`,
      [data.lab_request_id],
    );

    if (requestResult.rows.length === 0) {
      const error = new Error("Permintaan lab tidak ditemukan.");
      error.status = 404;
      throw error;
    }

    if (requestResult.rows[0].status !== "PENDING") {
      const error = new Error(
        "Hanya permintaan lab berstatus PENDING yang dapat diproses.",
      );
      error.status = 400;
      throw error;
    }

    const insertResult = await client.query(
      `INSERT INTO lab_results
         (lab_request_id, result_value, unit, reference_range, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.lab_request_id,
        data.result_value,
        data.unit || null,
        data.reference_range || null,
        data.notes || null,
      ],
    );

    await client.query(
      `UPDATE lab_requests
       SET status = 'COMPLETED',
           updated_at = NOW()
       WHERE id = $1`,
      [data.lab_request_id],
    );

    await client.query("COMMIT");

    return insertResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  findAllRequests,
  findRequestById,
  findResultsByRequestId,
  createResult,
};
