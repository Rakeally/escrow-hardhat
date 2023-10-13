const db = require("./server");
const express = require("express");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

app.post("/create-escrow", (req, res) => {
  const { address, arbiter, beneficiary, value, approved } = req.body;
  db.run(
    `INSERT INTO escrows (address, arbiter, beneficiary, value, approved) VALUES (?, ?, ?, ?, ?)`,
    [address, arbiter, beneficiary, value, approved],
    function (error) {
      if (error) {
        console.error(error.message);
      }
    }
  );

  res.send({ address, arbiter, beneficiary, value, approved });
});

app.put("/update-escrow/:address", async (req, res) => {
  const { address } = req.params;
  const { approved } = req.body;

  const sql = `UPDATE escrows SET approved = ? WHERE address = ?;`;
  let escrowData;

  db.run(sql, [approved, address], async function (error) {
    if (error) {
      console.error(error.message);
      res.status(500).send("Error updating escrow");
    }

    db.get("SELECT * FROM escrows WHERE address = ?", [address], (err, row) => {
      if (err) {
        res.status(500).send("Error updating escrow");
      } else {
        escrowData = row;
        res.send(escrowData);
      }
    });
  });
});

app.get("/all-escrows", (req, res) => {
  db.all("SELECT * FROM escrows", (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
      return;
    }
    res.send(rows);
  });
});

app.listen(PORT, function () {
  console.log(`Server is running on: ${PORT}`);
});
