const mongoose = require("mongoose");


const MailSchema = new mongoose.Schema({
  userid:{
      type:mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  receiver: String,
  mailtext: String,
});

module.exports = mongoose.model("Mail", MailSchema);
