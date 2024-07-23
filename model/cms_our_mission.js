const mongoose = require('mongoose')
const cms_our_missionSchema = new mongoose.Schema({
          

               Heading : {
                       type : String
               },
               Description : {
                    type : String
               }
              

}, {timestamps : true })

const cms_our_mission_Model = mongoose.model('cms_our_mission', cms_our_missionSchema)

module.exports = cms_our_mission_Model