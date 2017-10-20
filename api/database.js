const express = require('express');
const router = express.Router();
var GoogleSpreadsheet = require('google-spreadsheet');

const SPREADSHEET_ID = '1Lv9abGVXsvtzOIt3k7y69qzyhPTP1bgyn_yuI07BQBQ';
const ARTICLE_SHEET = 1;

var doc = new GoogleSpreadsheet(SPREADSHEET_ID);

function handleSend(res, err, content) {
    if(err) {
      console.log("failed query -----------------");
      res.status(500).send(err);
    } else {
      res.send(content);
    }
  }

function setAuth(step) {
    var creds = {
        client_email: process.env.CLIENT_EMAIL,
        private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n')
    }
    
    doc.useServiceAccountAuth(creds, ()=> {console.log('db authorized');});
}
setAuth();



//
router.get('/all_data', function(req, res) {
    const data = req.query;
  
    doc.getRows(ARTICLE_SHEET, (err, rows) => {
      handleSend(res,err,rows);
    });
  });

router.post('/addRow', function(req, res) {
  const data = req.body;

  doc.addRow(ARTICLE_SHEET,data.newRow, (err, row) => {
    handleSend(res,err,"row added");
  });
});


module.exports = router;


  