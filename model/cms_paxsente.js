const mongoose = require('mongoose')
const cms_paxsente_schema = new mongoose.Schema({
          

               Heading : {
                       type : String
               },
               Description : {
                    type : String
               }
              

}, {timestamps : true })

const cms_paxsente_Model = mongoose.model('cms_paxsente', cms_paxsente_schema)

module.exports = cms_paxsente_Model