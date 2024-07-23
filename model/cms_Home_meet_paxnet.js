const mongoose = require('mongoose')
const cms_home_meet_paxnet_Schema = new mongoose.Schema({

          Heading : {
                  type : String
          },
          Description : {
                type : String
          },
          Description1 : {
              type : String

          }
} , { timestamps : true })

const cms_home_meet_paxnet_model = mongoose.model('cms_home_meet_paxnet' , cms_home_meet_paxnet_Schema)
module.exports = cms_home_meet_paxnet_model