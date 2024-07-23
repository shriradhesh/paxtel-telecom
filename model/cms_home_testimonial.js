const mongoose = require('mongoose')
const cms_Home_testimonial_Schema = new mongoose.Schema({
       Heading: {
           type : String
       },
       Description : {
              type : String
       },
     
       image : {
             type : String
       }
}, {timestamps : true })

const cms_Home_testimonial_model = mongoose.model('cms_home_testimonial', cms_Home_testimonial_Schema)

module.exports = cms_Home_testimonial_model