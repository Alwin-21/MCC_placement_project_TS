const { Pool } = require("pg");
const pool = new Pool({ connectionString: "postgresql://postgres:admin123@127.0.0.1:5432/mcc_portfolio_db" });
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'AssessmentQuestions' ORDER BY ordinal_position")
  .then(r => { 
    console.log("Columns in AssessmentQuestions:");
    r.rows.forEach(x => console.log(" -", x.column_name, ":", x.data_type));
    pool.end(); 
  })
  .catch(e => { console.error(e.message); pool.end(); });
