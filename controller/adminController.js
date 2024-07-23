const adminModel = require('../model/admin')
const bcrypt = require('bcrypt')
const send_adminEmail = require('../utils/adminEmail')
const expire_email = require('../utils/expiry_notification_email')
const categorieModel = require('../model/categories')
const planModel = require('../model/plan')
const productModel = require('../model/product')
const sim_model = require('../model/simcard')
const SimProduct = require('../model/simproductSchema')
const cron = require('node-cron');
const twilio = require('twilio');
const cms_Home_testimonial_model = require('../model/cms_home_testimonial')
const path = require('path')
const cms_home_choose_pxtel_network_Model = require('../model/cms_home_choose_pxtel_network')
const cms_home_meet_paxnet_model = require('../model/cms_Home_meet_paxnet')
const cms_footer_contentModel = require('../model/cms_footer')
const cms_about_pxtel_Model = require('../model/cms_about_paxtel')
const cms_our_Goal_Model = require('../model/cms_our_goal')
const cms_our_mission_Model = require('../model/cms_our_mission')
const cms_our_vision_Model = require('../model/cms_our_vision')
const cms_our_telecom_service_model = require('../model/cms_about_our_telecom_service')
const cms_our_voice_service_Model = require('../model/cms_voice_service')
const cms_our_Data_service_model = require('../model/cms_Data_service')
const cms_paxsente_Model = require('../model/cms_paxsente')
// Configure your Twilio client
const client = new twilio('AC126e34876c0bcb57eca92293dedfbc93', '128773bbc265367e91c641b5b62f3d62');




// Cron job to check for plan expiry

cron.schedule('0 0 * * *', async () => { // Runs every day at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
      // Find all active SIM holders
      const simHolders = await sim_model.find({ expiryDate: { $gte: today }, status: 'active' });

      for (const simHolder of simHolders) {
          const expiryDate = new Date(simHolder.expiryDate);
          const daysRemaining = (expiryDate - today) / (1000 * 60 * 60 * 24);

          if (daysRemaining <= 3 && daysRemaining >= 0) {
              // Notify user about upcoming expiry
              const subject = 'Plan Expiry Notification';
              const content = `Dear ${simHolder.user.user_name}, your plan will expire on ${expiryDate.toDateString()}. Please renew your plan soon.`;

              // Send Email
              try {
                  await expire_email(simHolder.user.user_email, subject, content);
              } catch (emailError) {
                  console.error(`Failed to send email to ${simHolder.user.user_email}:`, emailError);
              }

              // Send SMS
              const smsMessage = `Dear ${simHolder.user.user_name}, your plan will expire on ${expiryDate.toDateString()}. Please renew your plan soon.`;
              try {
                  await sendSMS(simHolder.user.contactNumber, smsMessage);
              } catch (smsError) {
                  console.error(`Failed to send SMS to ${simHolder.user.contactNumber}:`, smsError);
              }
          } else if (daysRemaining < 0) {
              // Update the status of expired SIM holders
              simHolder.status = 'plan Expire';
              await simHolder.save();
          }
      }

      // Check and handle SIM Products
      const simProducts = await SimProduct.find({ status: 'active' });

      for (const simProduct of simProducts) {
          const product = await productModel.findById(simProduct.selectedCategories.product);
          if (!product) {
              console.log(`Product with ID ${simProduct.selectedCategories.product} not found`);
              continue;
          }

          const duration = product.duration; // Assuming 'duration' is a field in productModel
          let expiryDate;

          switch (duration) {
              case 'Daily':
                  expiryDate = new Date(simProduct.createdAt);
                  expiryDate.setDate(expiryDate.getDate() + 1);
                  break;
              case 'Weekly':
                  expiryDate = new Date(simProduct.createdAt);
                  expiryDate.setDate(expiryDate.getDate() + 7);
                  break;
              case 'Monthly':
                  expiryDate = new Date(simProduct.createdAt);
                  expiryDate.setMonth(expiryDate.getMonth() + 1);
                  break;
              case 'Yearly':
                  expiryDate = new Date(simProduct.createdAt);
                  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                  break;
              case 'No Expiry':
                  continue; // Skip expiry check for products with no expiry
              default:
                  console.log(`Unknown duration type: ${duration}`);
                  continue;
          }

          // Check if the product's expiry date has passed
          if (expiryDate < today) {
              // Update the status of expired SimProduct
              simProduct.status = 'plan Expire';
              await simProduct.save();

              // Notify user about the product plan expiry
              const subject = 'Product Plan Expiry Notification';
              const content = `Dear user, your product plan associated with SIM number ${simProduct.sim_number} will expire soon. Please take necessary actions.`;

              // Send Email
              try {
                  await expire_email(simProduct.user_email, subject, content);
              } catch (emailError) {
                  console.error(`Failed to send email to ${simProduct.user_email}:`, emailError);
              }

              // Send SMS
              const smsMessage = `Dear user, your product plan associated with SIM number ${simProduct.sim_number} will expire soon. Please take necessary actions.`;
              try {
                  await sendSMS(simProduct.sim_number, smsMessage);
              } catch (smsError) {
                  console.error(`Failed to send SMS to ${simProduct.sim_number}:`, smsError);
              }
          }
      }
  } catch (err) {
      console.error('Error in cron job:', err);
  }
});

console.log('Cron job started.');

// Function to send SMS
const sendSMS = async (phoneNumber, message) => {
  try {
      await client.messages.create({
          body: message,
          from: process.env.twillio_phone,
          to: phoneNumber,
      });
      console.log('SMS sent successfully');
  } catch (error) {
      console.log(error, 'SMS not sent');
  }
};


const adminLogin = async (req, res) => {
    try {
      const { email , password } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          Message: "email Required",
        });
      }
      if (!password) {
        return res.status(400).json({
          success: false,
          message : "password Required",
        });
      }
      // Find Admin by email
      const admin = await adminModel.findOne({ email });
  
      if (!admin) {
        return res
          .status(400)
          .json({ message : "email incorrect", success: false });
      }
  
      // Check if the stored password is in plain text
      if (admin.password && admin.password.startsWith("$2b$")) {
        // Password is already bcrypt hashed
        const passwordMatch = await bcrypt.compare(password, admin.password);
  
        if (!passwordMatch) {
          return res
            .status(400)
            .json({ message : "Password incorrect", success: false });
        }
      } else {
        // Convert plain text password to bcrypt hash
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
  
        // Update the stored password in the database
        admin.password = hashedPassword;
        await admin.save();
      }
  
      return res.json({
        message: "Admin Login Successful",
        success: true,
        data: {
          adminId: admin._id,
          name: admin.name,
          email: admin.email,
          profileImage: admin.profileImage,
          password: admin.password,
          status: admin.status,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: " server error", success: false , error_message : error.message });
    }
  };


  // Api for update admin details

  const updateAdmin = async (req, res) => {
    try {
      const adminId = req.params.adminId;
      const { email, name } = req.body;
  
      // Check for adminId
      if (!adminId) {
        return res.status(400).json({
          success: false,
          message: 'Admin ID required',
        });
      }
  
      // Check for admin
      const admin = await adminModel.findOne({ _id: adminId });
  
      if (!admin) {
        return res.status(400).json({
          success: false,
          message: 'Admin details not found',
        });
      }
  
      // Update admin details
      admin.email = email || admin.email;
      admin.name = name || admin.name;
  
      if (req.file) {
        admin.profileImage = req.file.filename;
      }
  
      await admin.save();
  
      return res.status(200).json({
        success: true,
        message: 'Admin details updated successfully',
      });
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error_message: error.message,
      });
    }
  };
  

  // Api for change admin password

             const changeAdmin_Password = async ( req , res )=> {
                      try {
                             const adminId = req.params.adminId
                             const {oldPassword ,  newPassword , confirmPassword } = req.body
                            
                            // check for adminId
                               if(!adminId)
                               {
                                return res.status(400).json({
                                    success : false ,
                                    message : 'adminId required'
                                })
                               }
                            // check for admin Details

                               const admin = await adminModel.findOne({
                                      _id : adminId
                               })

                              if(!admin)
                              {
                                return res.status(400).json({
                                   success : false ,
                                   message : 'admin Details not found'
                                })
                              }

                              // check for required fields
                              const requiredFields = ['oldPassword' , 'newPassword' , 'confirmPassword']
                              for(let field of requiredFields)
                              {
                                   if(!req.body[field])
                                   {
                                    return res.status(400).json({
                                         success : false ,
                                         message : `Missing ${field.replace("_", " ")}`
                                    })
                                   }
                              }

                                 // check for new Password and confirm password match or not

                                 if(newPassword !== confirmPassword)
                                 {
                                    return res.status(400).json({
                                         success : false ,
                                         message : 'confirm password not matched'
                                    })
                                 }                              

                                 //  check for old password is matched with storedPassword
                              const isOldPasswordValid = await bcrypt.compare(
                                    oldPassword,
                                    admin.password
                                  );

                                    if(!isOldPasswordValid)
                                   {
                                        return res.status(400).json({
                                           success : false ,
                                           message : 'old password not valid'
                                        })
                                    }
                               
                                    // bcrypt the new password
                                  
                                    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
                                    admin.password = hashedNewPassword;
                        // Prepare email content for the admin
                const adminEmailContent = `
                <p>Congratulations! Your Password Has been Changed .</p>
                <p>Here are your account details:</p>
                <table style="border-collapse: collapse; width: 50%; margin: auto; border: 1px solid #4CAF50; border-radius: 10px;">
                <tr>
                    <td style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd; font-weight: bold;"><strong>Email:</strong></td>
                    <td style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">${admin.email}</td>
                </tr>
                <tr>
                    <td style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd; font-weight: bold;"><strong>Password:</strong></td>
                    <td style="padding: 12px; text-align: left; border-bottom: 1px solid #ddd;">${newPassword}</td>
                </tr>
               
            </table>
            `;
                  // Send email to the admin
                    await send_adminEmail (admin.email, `Password Changed successfully ..!`, adminEmailContent);
                    await admin.save();

                    
                    return res.status(200).json({
                      success: true,
                      message: "Password changed Successfully",
                     
                  });
                              
                          }
                    catch (error) {
                          return res.status(500).json({
                              success : false ,
                              message : 'server error'
                          })
                      }
             }


             // Api for get admin Details 

             const getAdmin = async( req , res )=> {
                 try {
                       const adminId = req.params.adminId
                       if(!adminId)
                       {
                        return res.status(400).json({
                           success : false ,
                           message : 'admin Id required'
                        })
                       }

                       // check for admin 

                       const admin = await adminModel.findOne({ _id : adminId })

                       if(!admin)
                       {
                        return res.status(400).json({
                           success : false ,
                           message : 'admin not found'
                        })
                       }

                       return res.status(200).json({
                         success : true ,
                         message : 'admin Details',
                         Details : admin
                       })
                 } catch (error) {
                     return res.status(500).json({
                       success : false ,
                       message : 'server error',
                       error_message : error.message
                     })
                 }
             }


                                                  /* categories Section */
            // Api to add category 
                 const add_category = async ( req , res )=> {
                    try {
                           const { category_Name } = req.body
                          // check for required fields

                        if(!category_Name)
                        {
                          return res.status(400).json({
                             success : false ,
                             message : 'category_Name required'
                          })
                        }

                         // Check for category
                        const existCategory = await categorieModel.findOne({ category_Name : category_Name });
                    
                        if (existCategory) {
                          return res
                            .status(400)
                            .json({ message: " category_Name already exist ", success: false });
                        }
                    
                        const new_category_Name = new categorieModel({
                          category_Name : category_Name,
                        });
                        const save_new_category_Name = await new_category_Name.save();

                        return res.status(200).json({
                           success : true ,
                           message : 'new category addedd successfully'
                        })
                    
                    } catch (error) {
                        return res.status(500).json({
                           success : false ,
                           message : 'server error',
                           error_message : error.message
                        })
                    }
                 }

          // Api for get all categories
           const get_categories = async( req , res )=> {
             try {
                    // check for categories
                  const categories = await categorieModel.find()
                  if(!categories)
                  {
                    return res.status(400).json({
                       success : false ,
                       message : 'no categories found'
                    })
                  }

                  return res.status(200).json({
                     success : true ,
                     message : 'all categories',
                     details : categories.map((category)=> ({
                              category_Id : category._id,
                              category_Name : category.category_Name,
                              status : category.status
                     }))
                  })
             } catch (error) {
                 return res.status(500).json({
                   success : false ,
                   message : 'server error',
                   error_message :  error.message
                 })
             }
           }

      // Api for delete particular category
       
                  const delete_category = async ( req , res )=> {
                     try {
                             const category_Id = req.params.category_Id
                          // check for category Id
                          if(!category_Id)
                          {
                            return res.status(400).json({
                               success : false ,
                               message : 'category Id required'
                            })
                          }

                          // check for category 

                          const get_category = await categorieModel.findOne({ _id : category_Id })

                          if(!get_category)
                          {
                            return res.status(400).json({
                               success : false ,
                               message : 'No category found'
                            })
                          }

                          await get_category.deleteOne()

                          return res.status(200).json({
                               success : true ,
                               message : 'category Deleted successfully'
                          })
                     } catch (error) {
                         return res.status(500).json({
                           success : false ,
                           message : 'server error',
                           error_message : error.message
                         })
                     }
                  }

                                      /* Plan Section */

          // APi for add a new plan

          const add_new_Plan = async (req, res) => {
            try {
              const { plan_Name, plan_Description, plan_price, plan_type, status, start_date, end_date } = req.body;
          
              // Check for required fields
              const requiredFields = ['plan_Name', 'plan_Description', 'plan_price', 'plan_type', 'start_date', 'end_date'];
          
              for (let field of requiredFields) {
                if (!req.body[field]) {
                  return res.status(400).json({
                    success: false,
                    message: `Missing ${field.replace("_", " ")}`
                  });
                }
              }
          
              const today = new Date();
          
              // Check if there is an existing plan with the same name and end_date is after today's date
              const exist_plan = await planModel.findOne({ plan_Name, end_date: { $gte : today } });
              if (exist_plan) {
                return res.status(400).json({
                  success: false,
                  message: 'A plan with the same name already exists or is not expired yet'
                });
              }
          
              // Create new plan
              const newPlan = new planModel({
                plan_Name,
                plan_Description,
                plan_price,
                plan_type,
                status,
                start_date,
                end_date
              });
          
              await newPlan.save();
          
              return res.status(200).json({
                success: true,
                message: 'Plan added successfully',
                data: newPlan
              });
          
            } catch (error) {
              return res.status(500).json({
                success: false,
                message: 'Server error',
                error_message: error.message
              });
            }
          };
          

          // Api for get all plans
              const get_all_plans = async ( req , res )=> {
                   try {
                            // check for all plans

                            const all_plans = await planModel.find()
                          if(!all_plans)
                          {
                            return res.status(400).json({
                               success : false ,
                               message : 'no plans found'
                            })
                          }

                          // sorted the plans
                          const sortedPlans = await all_plans.sort(( a , b ) => b.created - a.created);
                          return res.status(200).json({
                             success : true ,
                             message : 'All Plans',
                             All_plans : sortedPlans
                          })

                   } catch (error) {
                       return res.status(500).json({
                         success : false ,
                         message : 'server error',
                         error_message : error.message
                       })
                   }
              }

            // Api for update a plan 
                   const update_Plan = async ( req , res )=> {
                      try {
                               const plan_id  = req.params.plan_id
                               const { plan_Name , plan_Description , plan_type , plan_price 
                                   } = req.body 

                                   // check for plan_ID
                                if(!plan_id)
                                {
                                  return res.status(400).json({
                                     success : false ,
                                     message : 'plan Id required'
                                  })
                                }

                                // check for plan

                                const plan = await planModel.findOne({ _id : plan_id })

                                if(!plan)
                                {
                                  return res.status(400).json({
                                     success : false ,
                                     message : 'plan not found'
                                  })
                                }

                                     plan.plan_Name = plan_Name
                                     plan.plan_Description = plan_Description
                                     plan.plan_price = plan_price
                                     plan.plan_type = plan_type

                                     await plan.save()

                                     return res.status(200).json({
                                       success : true ,
                                       message : 'plan updated successfully'
                                     })
                      } catch (error) {
                          return res.status(500).json({
                             success : false ,
                             message : 'server error',
                             error_message :  error.message
                          })
                      }
                   }

            // Api for delete particular plan

             const delete_plan = async ( req , res )=> {
               try {
                           const plan_id = req.params.plan_id

                  // check for plan id
                     if(!plan_id)
                     {
                      return res.status(400).json({
                         success : false ,
                         message : 'plan Id required'
                      })
                     }
                     // check for plan
                     const plan = await planModel.findOne({ _id : plan_id })
                     if(!plan)
                     {
                      return res.status(400).json({
                         success : false ,
                         message : 'plan not found'
                      })
                     }

                     await plan.deleteOne()

                     return res.status(200).json({
                       success : true ,
                       message : 'plan deleted successfully'
                     })
               } catch (error) {
                   return res.status(500).json({
                     success : false ,
                     message : 'server error',
                     error_message :  error.message
                   })
               }
             }

             // Api for get particular plan
          const get_particular_plan = async ( req , res )=> {
             try {
                      const plan_id = req.params.plan_id
                  // check for plan id

                  if(!plan_id)
                  {
                    return res.status(400).json({
                       success : false ,
                       message : 'plan id required'
                    })
                  }

                  // check for plan
                  const plan  = await planModel.findOne({ _id : plan_id })
                  if(!plan)
                  {
                    return res.status(400).json({
                       success : false ,
                       message : 'plan not found'
                    })
                  }

                  return res.status(200).json({
                     success : true ,
                     message : 'plan Details',
                     plan_Detail : plan
                  })
             } catch (error) {
                return res.status(500).json({
                   success : false ,
                   message : 'server error',
                   error_message : error.message
                })
             }
          }
                                                     /* Product Section */

          // Api for add new  product
          const add_product = async (req, res) => {
            try {
                const { product_name, category_Name, time, price, duration, speed, number_of_sms, limit, data } = req.body;
                
                // Check for already existing product
                const existingProduct = await productModel.findOne({ product_name, category_Name });
                if (existingProduct) {
                    return res.status(400).json({
                        success: false,
                        message: 'Product already exists in the category'
                    });
                }
                
                // Check if category exists
                const category = await categorieModel.findOne({ category_Name });
                if (!category) {
                    return res.status(400).json({
                        success: false,
                        message: 'Category does not exist'
                    });
                }
                
                // Create new product data
                let newProductData = {
                    product_name,
                    category_id: category._id,  // Assuming category_id is the _id of the category
                    price,
                    duration,
                    category_Name
                };
        
                // Modify product data based on category name
                switch (category_Name) {
                    case 'Voice Bundles':
                        newProductData.time = time;
                        break;
                    case 'Data Bundles':
                        newProductData.speed = speed;
                        break;
                    case 'SMS Bundles':
                        newProductData.number_of_sms = number_of_sms;
                        break;
                    case 'Combo Bundles':
                        newProductData.speed = speed;
                        newProductData.number_of_sms = number_of_sms;
                        break;
                    case 'Social Bundles':
                        break;
                    case 'Night Bundles':
                        newProductData.time = time;
                        newProductData.limit = limit;
                        newProductData.data = data;
                        break;
                    default:
                        return res.status(400).json({
                            success: false,
                            message: 'Invalid category name'
                        });
                }
        
                // Add new product
                const newProduct = new productModel(newProductData);
                await newProduct.save();
        
                return res.status(200).json({
                    success: true,
                    message: 'New product added successfully',
                    product: newProduct
                });
        
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Server error',
                    error_message: error.message
                });
            }
        };
        
        
              // Api for get all products details

               const get_products = async ( req , res )=> {
                try {
                      const products = await productModel.find()
                      
                      if(!products)
                      {
                        return res.status(400).json({
                           success : false ,
                           message : 'no products found'
                        })
                      }

                      // sort the products
                      const sorted_product = products.sort(( a , b ) => b.createdAt - a.createdAt)
                      return res.status(200).json({
                         success : true ,
                         message : 'all products',
                         products : sorted_product 
                      })
                } catch (error) {
                     return res.status(500).json({
                       success : false ,
                       message : 'server error',
                       error_message : error.message
                     })
                }
               }
            
          // get products of the category

             const products_of_category = async ( req , res )=> {
                try {
                                          
                      const category_Name = req.query.category_Name

                      if(!category_Name)
                      {
                        return res.status(400).json({
                           success : false ,
                           message : 'category_Name required'
                        })
                      }
                      const all_products = await productModel.find({ category_Name  })
                      if(!all_products)
                      {
                        return res.status(400).json({
                           success : false ,
                           message : 'no products found for the category'
                        })
                      }

                      return res.status(200).json({
                         success : true ,
                         message : 'all products of the category',
                         all_products : all_products
                      })
                      
                } catch (error) {
                     return res.status(500).json({
                       success : false ,
                       message : 'server error',
                       error_message : error.message
                     })
                }
             }


                                                              /* Sim card section */ 
            // Api for buy a sim card

            const Buy_sim_card = async ( req , res )=> {
               try {
                    const { ICCID , cellular_network_operator , 
                               user_name , contactNumber , user_email , planId  } = req.body
                      
                      // check for required fields
                       const requiredFields = ['ICCID' , 'cellular_network_operator' , 'user_name' , 'user_email', 'contactNumber' , 'planId']
                        
                       for ( let field of requiredFields)
                       {
                           if(!req.body[field])
                           {
                              return res.status(400).json({
                                 success : false ,
                                 message : `Missing ${field.replace("_", " " )}`
                              })
                           }
                       }

                      // Check for existing ICCID for the SIM
                          const exist_Sim = await sim_model.findOne({ ICCID, contactNumber });

                          if (exist_Sim) {
                              return res.status(400).json({
                                  success: false,
                                  message: 'SIM already exists with the same contact number and ICCID'
                              });
                          }

                          // check for plan
                          const plan  = await planModel.findOne({ _id : planId })                        
                            
                          
                       // add new sim
                        
                           const newSim = new sim_model({
                            ICCID ,
                            cellular_network_operator ,                                 
                            user :  { user_name, contactNumber , user_email },                            
                            planId,
                            activationDate : plan.start_date,
                            expiryDate : plan.end_date
                           })
                    
                           await newSim.save()
                            return res.status(200).json({
                               success : true ,
                               message : 'SIM Buyed successfully',
                               sim : newSim
                            })                         
                     
               } catch (error) {
                   return res.status(500).json({
                     success : false ,
                     message : 'server error',
                     error_message : error.message
                   })
               }
            }


      // Api for get sim holder data

           const get_sim_record = async ( req , res ) => {
             try {
                        // get details
                             
                        
                        const get_details = await sim_model.find()
                        if(!get_details)
                        {
                          return res.status(400).json({
                             success : false ,
                             message : 'no details found'
                          })
                        }

                        return res.status(200).json({
                           success : true ,
                           message : 'sim Holder Record',
                           Details : get_details
                        })
             } catch (error) {
                 return res.status(500).json({
                   success : false ,
                   message : 'server error',
                   error_message : error.message
                 })
             }
           }


                                                /* SIM Recharge section */
        // Api for recharge the sim
        const recharge_sim = async (req, res) => {
          try {
            const { sim_number, category, product } = req.body;
        
            if (!sim_number) {
              return res.status(400).json({
                success: false,
                message: 'SIM number is required'
              });
            }
        
            const sim = await sim_model.findOne({ 'user.contactNumber': sim_number });
            if (!sim) {
              return res.status(400).json({
                success: false,
                message: 'SIM not found'
              });
            }
        
            const selectedCategory = await categorieModel.findOne({ _id: category });
            if (!selectedCategory) {
              return res.status(400).json({
                success: false,
                message: 'Category does not exist'
              });
            }
        
            const selectedProduct = await productModel.findOne({
              _id: product,
              category_id: category
            });
        
            if (!selectedProduct) {
              return res.status(400).json({
                success: false,
                message: 'Product not found'
              });
            }
        
            // Check if the user already has an active plan in the same category
            const activePlan = await SimProduct.findOne({
              sim_number: sim.user.contactNumber,
              'selectedCategories.category': selectedCategory._id,
              status: { $ne: 'plan Expire' }
            });
        
            if (activePlan) {
              return res.status(400).json({
                success: false,
                message: 'You already have an active plan in this category'
              });
            }
        
            const simProduct = new SimProduct({
              sim_number: sim.user.contactNumber,
              user_email: sim.user.user_email,
              selectedCategories: {
                category: selectedCategory._id,
                product: selectedProduct._id
              }
            });
        
            await simProduct.save();
        
            const totalPrice = selectedProduct.price;
        
            return res.status(200).json({
              success: true,
              message: 'Plan activated successfully',
              simProduct,
              totalPrice
            });
        
          } catch (error) {
            return res.status(500).json({
              success: false,
              message: 'Server error',
              error_message: error.message
            });
          }
        };
        
      
    // Api for get all records of the new recharged data
              const get_recharged_record = async ( req , res )=> {
                 try {
                        // get all recharged data

                        const recharged_data = await SimProduct.find()
                        if(!recharged_data)
                        {
                          return res.status(400).json({
                             success : false ,
                             message : 'no record found'
                          })
                        }

                        // check sorted data
                        const sorted_data = await recharged_data.sort(( a , b ) => { b.createdAt - a.createdAt } )

                        return res.status(200).json({
                            success : true ,
                            message : 'recharged records',
                            record : sorted_data
                        })

                 } catch (error) {
                     return res.status(500).json({
                       success : false ,
                       message : 'server error',
                       error_message : error.message
                     })
                 }
              }
      
               
                                                            /* cms Section */

     const cms_Home_testimonial = async ( req , res )=> {
         try {
                  const { Heading , Description } = req.body
              // check for already exist data

                 const exist_data = await cms_Home_testimonial_model.findOne({ })
                 if(exist_data)
                 {
                       exist_data.Heading = Heading
                       exist_data.Description = Description                       
                       if(!req.body)
                       {
                            exist_data.image = req.file.filename
                       }
                            await exist_data.save()

                       return res.status(200).json({
                            success : true ,
                            message : 'Details updated successfully'
                       })
                 }
                 else
                 {
                         if(!Heading)
                         {
                           return res.status(400).json({
                             success : false ,
                             message : 'Heading Required'
                           })
                         }

                         if(!Description)
                         {
                          return res.status(400).json({
                             success : false ,
                             message : 'Description Required'
                          })
                         }
                                    // Add image 
                  let image =  null;
                    if (req.file && req.file.filename) {
                        // Get the file extension
                        const fileExtension = path.extname(req.file.filename).toLowerCase();

                        // List of allowed extensions
                        const allowedExtensions = ['.jpg', '.jpeg', '.png'];

                        // Check if the file extension is in the allowed list
                        if (allowedExtensions.includes(fileExtension)) {
                            // If valid, update the profile image
                            image = req.file.filename;
                        } else {
                            // If not valid, throw an error
                            return res.status(400).json({
                                success : false ,
                                message :  'Invalid file type. Only .jpg, .jpeg, and .png files are allowed.'
                        });
                        }
                    }
                         // save a new Data 
                            const newData =  new cms_Home_testimonial_model({
                                Heading,
                                Description ,
                                image
                            })

                              await newData.save()

                              return res.status(200).json({
                                 success : true ,
                                 message : 'new cms Home testimonial added' ,
                                 details : newData
                              })
                 }

         } catch (error) {
             return res.status(500).json({
                  success : false ,
                  message : 'server error',
                  error_message : error.message
             })
         }
     }     

      // Api for get cms home testimonial details

             const get_cms_home_testimonial = async ( req , res ) => {
                   try {
                          // check for details
                          const get_details = await cms_Home_testimonial_model.find()
                          
                          if(!get_details)
                          {
                            return res.status(400).json({
                               success : false ,
                               message : 'no details found'
                            })
                          }

                          return res.status(200).json({
                             success : true ,
                             message : 'cms Home testimonial details',
                             Details : get_details
                          })
                   } catch (error) {
                       return res.status(500).json({
                         success : false ,
                         message : 'server error',
                         error_message : error.message
                       })
                   }
             }


        // Api for cms_home_choose_pxtel_network
                const cms_home_choose_pxtel_network = async ( req , res ) => {
                     try {
                            const { Heading , sub_Heading1 ,
                                   sub_Description1 , sub_Heading2 ,
                                   sub_Description2 , sub_Heading3 ,
                                   sub_Description3 , sub_Heading4 ,
                                   sub_Description4 } = req.body

                          // check for already exist data 
                          const exist_data = await cms_home_choose_pxtel_network_Model.findOne({ })
                          if(exist_data)
                          {
                               exist_data.Heading = Heading
                               exist_data.sub_Heading1 = sub_Heading1
                               exist_data.sub_Description1 = sub_Description1
                               
                               exist_data.sub_Heading2 = sub_Heading2
                               exist_data.sub_Description2 = sub_Description2
                               
                               exist_data.sub_Heading3 = sub_Heading3
                               exist_data.sub_Description3 = sub_Description3
                               
                               exist_data.sub_Heading4 = sub_Heading4
                               exist_data.sub_Description4 = sub_Description4

                               await exist_data.save()

                               return res.status(200).json({
                                        success : true ,
                                        message : 'details updated successfully'
                               })                              
                               
                          }
                          else
                          {
                                const requiredFields = ['Heading' ,
                                   'sub_Heading1' , 'sub_Description1' , 
                                   'sub_Heading2' , 'sub_Description2',
                                   'sub_Heading3' , 'sub_Description3',
                                   'sub_Heading4' , 'sub_Description4']

                                   for(let field of requiredFields)
                                   {
                                        if(!req.body[field])
                                        {
                                            return res.status(400).json({
                                               success : false ,
                                               message : `Missing ${field.replace('_',' ')}`
                                            })
                                        }
                                   }

                                   // create new data
                                   const newData = new cms_home_choose_pxtel_network_Model({
                                       Heading,
                                       sub_Heading1,
                                       sub_Description1,
                                       sub_Heading2,
                                       sub_Description2,
                                       sub_Heading3,
                                       sub_Description3,
                                       sub_Heading4,
                                       sub_Description4,
                                       
                                   })

                                   await newData.save()

                                   return res.status(200).json({
                                       success : true ,
                                       message : 'cms_home_choose_pxtel_network created',
                                       Details : newData
                                   })
                          }
                     } catch (error) {
                        return res.status(500).json({
                           success : false ,
                           message : 'server error',
                           error_message : error.message
                        })
                     }
                }

        // Api for get cms_home_choose_pxtel_network
                      const get_cms_home_choose_pxtel_network = async ( req , res )=> {
                              try {
                                      // check for details
                                      const get_details = await cms_home_choose_pxtel_network_Model.findOne({})
                                      if(!get_details)
                                      {
                                         return res.status(400).json({
                                             success : false ,
                                             message : 'Details not found'
                                         })
                                      }

                                      return res.status(200).json({
                                         success : true ,
                                         message : 'cms_home_choose_pxtel_network Details',
                                         Details : get_details
                                      })
                              } catch (error) {
                                   return res.status(500).json({
                                       success : false ,
                                       message : 'server error',
                                       error_message : error.message
                                   })
                              }
                      }


        // Api for cms_home_meet_paxnet

                const cms_home_meet_paxnet = async ( req , res )=> {
                      try {
                                const { Heading , Description , Description1} = req.body
                          // check for exist_data
                          const exist_data = await cms_home_meet_paxnet_model.findOne({ })
                          if(exist_data)
                          {
                               exist_data.Heading = Heading
                               exist_data.Description = Description
                               exist_data.Description1 = Description1

                               await exist_data.save()

                               return res.status(200).json({
                                    success : true ,
                                    message : 'details updated successfully'
                               })
                          }

                          else {
                                 if(!Heading)
                                 {
                                    return res.status(400).json({
                                       success : false ,
                                       message : 'Heading required'
                                    })
                                 }
                                 if(!Description)
                                 {
                                    return res.status(400).json({
                                       success : false ,
                                       message : 'Description required'
                                    })
                                 }
                                 if(!Description1)
                                 {
                                    return res.status(400).json({
                                       success : false ,
                                       message : 'Description1 required'
                                    })
                                 }

                                 // save new data
                                  const newData = await new cms_home_meet_paxnet_model({
                                        Heading,
                                        Description,
                                        Description1
                                  })

                                      await newData.save()

                                      return res.status(200).json({
                                         success : true ,
                                         message : 'cms_home_meet_paxnet Details added',
                                         details : newData
                                      })


                          }
                      } catch (error) {
                         return res.status(500).json({
                            success : false ,
                            message : 'server error',
                            error_message : error.message
                         })
                      }
                }

  // Api for get cms_home_choose_pxtel_network
  const get_cms_home_meet_paxnet = async ( req , res )=> {
    try {
            // check for details
            const get_details = await cms_home_meet_paxnet_model.findOne({})
            if(!get_details)
            {
               return res.status(400).json({
                   success : false ,
                   message : 'Details not found'
               })
            }

            return res.status(200).json({
               success : true ,
               message : 'cms_home_meet_paxnet_model Details',
               Details : get_details
            })
    } catch (error) {
         return res.status(500).json({
             success : false ,
             message : 'server error',
             error_message : error.message
         })
    }
}

// Api for footer cms

const cms_footer_content = async (req, res) => {
  try {       
      
      const {  Description } = req.body;

      // Check for exist cms_footer_content
      const exist_cms_footer_content = await cms_footer_contentModel.findOne({ });

      if (exist_cms_footer_content) {
          // Update existing section
         
          exist_cms_footer_content.Description = Description;
         

        
          await exist_cms_footer_content.save();

          return res.status(200).json({
              success: true,
              message: 'Details updated successfully'
          });
      } else {
          
          // Check for Description
          if (!Description) {
              return res.status(400).json({
                  success: false,
                  message: 'Description is required'
              });
          }                 
         
         
          // Add new Data
          const newData = new cms_footer_contentModel({
             
             
              Description: Description
             
          });

          await newData.save();

          return res.status(200).json({
              success: true,
              message: 'New Details created successfully'
          });
      }
  } catch (error) {
      return res.status(500).json({
          success: false,
          message: 'Server error',
          error_message: error.message
      });
  }
};


// Api for get cms footer content

const get_cms_footer_content = async( req , res)=>{
  try {
          const allDetails = await cms_footer_contentModel.find({
                    
          })
          if(!allDetails)
          {
            return res.status(400).json({
                   success : false ,
                   message : 'no Details found'
            })
          }

            return res.status(200).json({
                 success : true ,
                 message : 'allDetails ',
                 Details : allDetails
            })
  } catch (error) {
     return res.status(500).json({
           success : false ,
           message : 'server error',
           error_message : error.message
     })
  }
}

// Api for create and update cms about paxtel
            const cms_about_paxtel = async ( req , res )=> {
                 try {
                         const { Heading , Description } = req.body
                    // check for alreadt exist data
                       const exist_data = await cms_about_pxtel_Model.findOne({ })
                       if(exist_data)
                       {
                            exist_data.Heading = Heading
                            exist_data.Description = Description

                            await exist_data.save()

                            return res.status(200).json({
                               success : true ,
                               message : 'details updated successfully'
                            })
                       }

                       else
                       {
                           if(!Heading)
                           {
                              return res.status(400).json({
                                 success : false ,
                                 message : 'Heading Required'
                              })
                           }

                           if(!Description)
                           {
                              return res.status(400).json({
                                 success : false ,
                                 message : 'Description Required'
                              })
                           }

                            // add new Data 
                            const newData = new cms_about_pxtel_Model({
                                           Heading,
                                           Description
                            })

                            await newData.save()

                            return res.status(200).json({
                                success : true ,
                                message : 'New Data addedd successfully',
                                Details : newData
                            })
                       }
                 } catch (error) {
                     return res.status(500).json({
                           success : false ,
                           message : 'server error',
                           error_message : error.message
                     })
                 }
            }

        
                                // Api for get cms_about paxtel details
                                 
                      const get_cms_about_paxtel = async ( req , res )=>{
                          try {
                                       // check for details
                                  const get_details = await cms_about_pxtel_Model.find()
                                  if(!get_details)
                                  { 
                                     return res.status(400).json({
                                          success : false ,
                                          message : 'Details not found'
                                     })
                                  }

                                  return res.status(200).json({
                                        success : true ,
                                        message : 'cms_about_paxtel Details',
                                        Details : get_details
                                  })
                          } catch (error) {
                               return res.status(500).json({
                                  success : false ,
                                  message : 'server error',
                                  error_message : error.message
                               })
                          }
                      }


      
// Api for create and update cms our goal
const cms_our_goal = async ( req , res )=> {
  try {
          const { Heading , Description } = req.body
     // check for alreadt exist data
        const exist_data = await cms_our_Goal_Model.findOne({ })
        if(exist_data)
        {
             exist_data.Heading = Heading
             exist_data.Description = Description

             await exist_data.save()

             return res.status(200).json({
                success : true ,
                message : 'details updated successfully'
             })
        }

        else
        {
            if(!Heading)
            {
               return res.status(400).json({
                  success : false ,
                  message : 'Heading Required'
               })
            }

            if(!Description)
            {
               return res.status(400).json({
                  success : false ,
                  message : 'Description Required'
               })
            }

             // add new Data 
             const newData = new cms_our_Goal_Model({
                            Heading,
                            Description
             })

             await newData.save()

             return res.status(200).json({
                 success : true ,
                 message : 'New Data addedd successfully',
                 Details : newData
             })
        }
  } catch (error) {
      return res.status(500).json({
            success : false ,
            message : 'server error',
            error_message : error.message
      })
  }
}


  // Api for get cms_our goal details
                                 
  const get_cms_our_goal = async ( req , res )=>{
    try {
                 // check for details
            const get_details = await cms_our_Goal_Model.find()
            if(!get_details)
            { 
               return res.status(400).json({
                    success : false ,
                    message : 'Details not found'
               })
            }

            return res.status(200).json({
                  success : true ,
                  message : 'cms_our_goal',
                  Details : get_details
            })
    } catch (error) {
         return res.status(500).json({
            success : false ,
            message : 'server error',
            error_message : error.message
         })
    }
}


// Api for our mission
const cms_our_mission = async (req, res) => {
  try {
      const { Heading, Description } = req.body;       

      // Check if our mission data exists
      let exist_our_mission = await cms_our_mission_Model.findOne();

      if (exist_our_mission) {
          // Update existing data
          exist_our_mission.Heading = Heading;
          exist_our_mission.Description = Description;
          await exist_our_mission.save();

          return res.status(200).json({
              success: true,
              message: 'Details updated successfully'
          });
      } else {
           // Check if Heading is missing
      if (!Heading) {
          return res.status(400).json({
              success: false,
              message: 'Heading is required'
          });
      }

      // Check if Description is missing
      if (!Description) {
          return res.status(400).json({
              success: false,
              message: 'Description is required'
          });
      }
          // Create new data
          const newData = new cms_our_mission_Model({
              Heading,
              Description
          });

          await newData.save();

          return res.status(200).json({
              success: true,
              message: 'New details saved successfully'
          });
      }
  } catch (error) {
      return res.status(500).json({
          success: false,
          message: 'Server error',
          error_message: error.message
      });
  }
};


// Api for get cms our mission Details

const get_ourMission_details = async( req , res)=>{
      try {
           // check for details
           const checkDetails = await cms_our_mission_Model.find({
               
           })

           if(!checkDetails)
              {
                  return res.status(400).json({
                       success : false ,
                       message : 'no Details found'
                  })
              }

              return res.status(200).json({
                   success : true ,
                   message : 'our mission',
                   Details : checkDetails
              })
      } catch (error) {
          return res.status(500).json({
               success : false ,
               message : 'server error',
               error_message : error.message
          })
      }
}


              

// Api for our vision
const cms_our_vision = async (req, res) => {
  try {
      const { Heading, Description } = req.body;       

      // Check if our mission data exists
      let exist_our_vission = await cms_our_vision_Model.findOne();

      if (exist_our_vission) {
          // Update existing data
          exist_our_vission.Heading = Heading;
          exist_our_vission.Description = Description;
          await exist_our_vission.save();

          return res.status(200).json({
              success: true,
              message: 'Details updated successfully'
          });
      } else {
           // Check if Heading is missing
      if (!Heading) {
          return res.status(400).json({
              success: false,
              message: 'Heading is required'
          });
      }

      // Check if Description is missing
      if (!Description) {
          return res.status(400).json({
              success: false,
              message: 'Description is required'
          });
      }
          // Create new data
          const newData = new cms_our_vision_Model({
              Heading,
              Description
          });

          await newData.save();

          return res.status(200).json({
              success: true,
              message: 'New details saved successfully'
          });
      }
  } catch (error) {
      return res.status(500).json({
          success: false,
          message: 'Server error',
          error_message: error.message
      });
  }
};


// Api for get cms our vission Details

const get_ourVision_details = async( req , res)=>{
      try {
           // check for details
           const checkDetails = await cms_our_vision_Model.find({
               
           })

           if(!checkDetails)
              {
                  return res.status(400).json({
                       success : false ,
                       message : 'no Details found'
                  })
              }

              return res.status(200).json({
                   success : true ,
                   message : 'our vision',
                   Details : checkDetails
              })
      } catch (error) {
          return res.status(500).json({
               success : false ,
               message : 'server error',
               error_message : error.message
          })
      }
}


// Api for our telecom service
const cms_our_telecom_service = async (req, res) => {
  try {
      const { Heading, Description } = req.body;       

      // Check if our telecom data exists
      let exist_our_telecom_service= await cms_our_telecom_service_model.findOne();

      if (exist_our_telecom_service) {
          // Update existing data
          exist_our_telecom_service.Heading = Heading;
          exist_our_telecom_service.Description = Description;
          await exist_our_telecom_service.save();

          return res.status(200).json({
              success: true,
              message: 'Details updated successfully'
          });
      } else {
           // Check if Heading is missing
      if (!Heading) {
          return res.status(400).json({
              success: false,
              message: 'Heading is required'
          });
      }

      // Check if Description is missing
      if (!Description) {
          return res.status(400).json({
              success: false,
              message: 'Description is required'
          });
      }
          // Create new data
          const newData = new cms_our_telecom_service_model({
              Heading,
              Description
          });

          await newData.save();

          return res.status(200).json({
              success: true,
              message: 'New details saved successfully'
          });
      }
  } catch (error) {
      return res.status(500).json({
          success: false,
          message: 'Server error',
          error_message: error.message
      });
  }
};


// Api for get cms our telecom service

const get_our_telecom_service = async( req , res)=>{
  try {
       // check for details
       const checkDetails = await cms_our_telecom_service_model.find({
           
       })

       if(!checkDetails)
          {
              return res.status(400).json({
                   success : false ,
                   message : 'no Details found'
              })
          }

          return res.status(200).json({
               success : true ,
               message : 'our telecom service',
               Details : checkDetails
          })
  } catch (error) {
      return res.status(500).json({
           success : false ,
           message : 'server error',
           error_message : error.message
      })
  }
}

// Api for voice service
const cms_voice_service = async (req, res) => {
  try {
      const { Heading, Description } = req.body;       

      // Check if our voice exists
      let exist_voice_service= await cms_our_voice_service_Model.findOne();

      if (exist_voice_service) {
          // Update existing data
          exist_voice_service.Heading = Heading;
          exist_voice_service.Description = Description;
          await exist_voice_service.save();

          return res.status(200).json({
              success: true,
              message: 'Details updated successfully'
          });
      } else {
           // Check if Heading is missing
      if (!Heading) {
          return res.status(400).json({
              success: false,
              message: 'Heading is required'
          });
      }

      // Check if Description is missing
      if (!Description) {
          return res.status(400).json({
              success: false,
              message: 'Description is required'
          });
      }
          // Create new data
          const newData = new cms_our_voice_service_Model({
              Heading,
              Description
          });

          await newData.save();

          return res.status(200).json({
              success: true,
              message: 'New details saved successfully'
          });
      }
  } catch (error) {
      return res.status(500).json({
          success: false,
          message: 'Server error',
          error_message: error.message
      });
  }
};

// Api for get cms voice service

const get_cms_voice_service = async( req , res)=>{
  try {
       // check for details
       const checkDetails = await cms_our_voice_service_Model.find({
           
       })

       if(!checkDetails)
          {
              return res.status(400).json({
                   success : false ,
                   message : 'no Details found'
              })
          }

          return res.status(200).json({
               success : true ,
               message : 'our voice service',
               Details : checkDetails
          })
  } catch (error) {
      return res.status(500).json({
           success : false ,
           message : 'server error',
           error_message : error.message
      })
  }
}

// Api for cms data service
const cms_Data_service = async (req, res) => {
  try {
      const { Heading, Description } = req.body;       

      // Check if our data exists
      let exist_data_service= await cms_our_Data_service_model.findOne();

      if (exist_data_service) {
          // Update existing data
          exist_data_service.Heading = Heading;
          exist_data_service.Description = Description;
          await exist_data_service.save();

          return res.status(200).json({
              success: true,
              message: 'Details updated successfully'
          });
      } else {
           // Check if Heading is missing
      if (!Heading) {
          return res.status(400).json({
              success: false,
              message: 'Heading is required'
          });
      }

      // Check if Description is missing
      if (!Description) {
          return res.status(400).json({
              success: false,
              message: 'Description is required'
          });
      }
          // Create new data
          const newData = new cms_our_Data_service_model({
              Heading,
              Description
          });

          await newData.save();

          return res.status(200).json({
              success: true,
              message: 'New details saved successfully'
          });
      }
  } catch (error) {
      return res.status(500).json({
          success: false,
          message: 'Server error',
          error_message: error.message
      });
  }
};
 
// Api for get cms data service

const get_cms_data_service = async( req , res)=>{
  try {
       // check for details
       const checkDetails = await cms_our_Data_service_model.find({
           
       })

       if(!checkDetails)
          {
              return res.status(400).json({
                   success : false ,
                   message : 'no Details found'
              })
          }

          return res.status(200).json({
               success : true ,
               message : 'our Data service',
               Details : checkDetails
          })
  } catch (error) {
      return res.status(500).json({
           success : false ,
           message : 'server error',
           error_message : error.message
      })
  }
}


// Api for cms paxsete
const cms_paxsente = async (req, res) => {
  try {
      const { Heading, Description } = req.body;       

      // Check if our data exists
      let exist_paxsente= await cms_paxsente_Model.findOne();

      if (exist_paxsente) {
          // Update existing data
          exist_paxsente.Heading = Heading;
          exist_paxsente.Description = Description;
          await exist_paxsente.save();

          return res.status(200).json({
              success: true,
              message: 'Details updated successfully'
          });
      } else {
           // Check if Heading is missing
      if (!Heading) {
          return res.status(400).json({
              success: false,
              message: 'Heading is required'
          });
      }

      // Check if Description is missing
      if (!Description) {
          return res.status(400).json({
              success: false,
              message: 'Description is required'
          });
      }
          // Create new data
          const newData = new cms_paxsente_Model({
              Heading,
              Description
          });

          await newData.save();

          return res.status(200).json({
              success: true,
              message: 'New details saved successfully'
          });
      }
  } catch (error) {
      return res.status(500).json({
          success: false,
          message: 'Server error',
          error_message: error.message
      });
  }
};


// Api for get cms paxSente

const get_cms_paxSente = async( req , res)=>{
  try {
       // check for details
       const checkDetails = await cms_paxsente_Model.find({
           
       })

       if(!checkDetails)
          {
              return res.status(400).json({
                   success : false ,
                   message : 'no Details found'
              })
          }

          return res.status(200).json({
               success : true ,
               message : 'PaxSente',
               Details : checkDetails
          })
  } catch (error) {
      return res.status(500).json({
           success : false ,
           message : 'server error',
           error_message : error.message
      })
  }
}

          
  module.exports = {
    /* Admin Section */
    adminLogin , updateAdmin , changeAdmin_Password , getAdmin ,
    /* category section  */
    add_category , get_categories , delete_category,
    /* plans Section */
    add_new_Plan , get_all_plans , get_particular_plan , update_Plan , delete_plan,
    /* Product Section */
    add_product , get_products , products_of_category,
    /* Sim card section */
    Buy_sim_card , get_sim_record,
    /* sim card recharge section */
    recharge_sim , get_recharged_record,
    /* cms Home section */
    cms_Home_testimonial , get_cms_home_testimonial , cms_home_choose_pxtel_network ,
    get_cms_home_choose_pxtel_network  , cms_home_meet_paxnet , get_cms_home_meet_paxnet,
    cms_footer_content , get_cms_footer_content,
    /* Cms About section */
    cms_about_paxtel , get_cms_about_paxtel , cms_our_goal , get_cms_our_goal,
    cms_our_mission , get_ourMission_details , cms_our_vision , get_ourVision_details,
    cms_our_telecom_service , get_our_telecom_service ,cms_voice_service ,
    get_cms_voice_service , cms_Data_service , get_cms_data_service ,
    cms_paxsente , get_cms_paxSente
  } 
