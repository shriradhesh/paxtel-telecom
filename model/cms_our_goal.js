const mongoose = require('mongoose')
const cms_our_GoalSchema = new mongoose.Schema({
          

               Heading : {
                       type : String
               },
               Description : {
                    type : String
               }
              

}, {timestamps : true })

const cms_our_Goal_Model = mongoose.model('cms_our_Goal', cms_our_GoalSchema)

module.exports = cms_our_Goal_Model