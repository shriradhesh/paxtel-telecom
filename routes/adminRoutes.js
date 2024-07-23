const mongoose = require('mongoose')
const express = require('express');
const router = express.Router();

const multer = require('multer')
const upload = require('../upload')
const adminController = require('../controller/adminController')



                                                        /* Admin Section */
        
        // Api for admin login

        router.post("/adminLogin", adminController.adminLogin)
        // Api for update admin details
        router.post("/updateAdmin/:adminId" , upload.single('profileImage') , adminController.updateAdmin)
        // Api for changeAdmin_Password
        router.post("/changeAdmin_Password/:adminId", adminController.changeAdmin_Password)
        // Api for getAdmin
        router.get("/getAdmin/:adminId", adminController.getAdmin)

                                                    /* category section */
        // Api for add_category
        router.post('/add_category', adminController.add_category)
        // Api for get_categories
        router.get('/get_categories', adminController.get_categories)
        // Api for delete_category
        router.delete('/delete_category/:category_Id', adminController.delete_category)

                                                    /* plan Section */
        // Api for add new plan
        router.post('/add_new_Plan', adminController.add_new_Plan)
        // Api for get_all_plans
        router.get('/get_all_plans', adminController.get_all_plans)
        // Api for update_Plan
        router.put('/update_Plan/:plan_id', adminController.update_Plan)
        // Api for delete_plan
        router.delete('/delete_plan/:plan_id', adminController.delete_plan)
        // Api for get_particular_plan
        router.get('/get_particular_plan/:plan_id', adminController.get_particular_plan)
         
                                                  /* Product Section */
        // Api for add_product
        router.post('/add_product', adminController.add_product)
        // Api for get_products
        router.get('/get_products', adminController.get_products)
        // Api for produts_of_category
        router.get('/products_of_category', adminController.products_of_category)

                                                /* SIM card section */
        // Api for Buy_sim_card
        router.post('/Buy_sim_card', adminController.Buy_sim_card)         
        // Api for get_sim_record
        router.get('/get_sim_record', adminController.get_sim_record)       
        
                                                /* Recharge Sim section */
        // Api for recharge sim                                      
        router.post('/recharge_sim', adminController.recharge_sim)
        // Api for get_recharged_record
        router.get('/get_recharged_record', adminController.get_recharged_record)

                                                /* CMS Section */
        // Api for create and update cms_home_testimonial
        router.post('/cms_Home_testimonial', upload.single('image') , adminController.cms_Home_testimonial)
        // Api for get_cms_home_testimonial
        router.get('/get_cms_home_testimonial', adminController.get_cms_home_testimonial)
        // Api for create and update cms_home_choose_pxtel_network
        router.post('/cms_home_choose_pxtel_network', adminController.cms_home_choose_pxtel_network)
        // Api for get_cms_home_choose_pxtel_network
        router.get('/get_cms_home_choose_pxtel_network', adminController.get_cms_home_choose_pxtel_network)
        // Api for create and update cms_home_meet_paxnet
        router.post('/cms_home_meet_paxnet', adminController.cms_home_meet_paxnet)
        // Api for get_cms_home_meet_paxnet
        router.get('/get_cms_home_meet_paxnet', adminController.get_cms_home_meet_paxnet)
          // Api for cms_footer_content
        router.post('/cms_footer_content', adminController.cms_footer_content)
          // Api for get_cms_footer_content
        router.get('/get_cms_footer_content', adminController.get_cms_footer_content)

        // Api for cms_about_paxtel
        router.post('/cms_about_paxtel', adminController.cms_about_paxtel)
        // Api for get_cms_about_paxtel
        router.get('/get_cms_about_paxtel', adminController.get_cms_about_paxtel)
        // Api for cms_our_goal
        router.post('/cms_our_goal', adminController.cms_our_goal)
        // Api for get_cms_our_goal
        router.get('/get_cms_our_goal', adminController.get_cms_our_goal)
        // Api for create and update cms_our_mission
        router.post('/cms_our_mission', adminController.cms_our_mission)
        // Api for get_ourMission_details
        router.get('/get_ourMission_details', adminController.get_ourMission_details)
        // Api for cms_our_vision
        router.post('/cms_our_vision', adminController.cms_our_vision)
        // Api for get_ourVision_details
        router.get('/get_ourVision_details', adminController.get_ourVision_details)
        // Api for cms_our_telecom_service
        router.post('/cms_our_telecom_service', adminController.cms_our_telecom_service)
        // Api for get_our_telecom_service
        router.get('/get_our_telecom_service', adminController.get_our_telecom_service)
        // Api for cms_voice_service
        router.post('/cms_voice_service', adminController.cms_voice_service)
        // Api for get_cms_voice_service
        router.get('/get_cms_voice_service', adminController.get_cms_voice_service)
        // Api for cms_Data_service
        router.post('/cms_Data_service', adminController.cms_Data_service)
        // Api for get_cms_data_service
        router.get('/get_cms_data_service', adminController.get_cms_data_service)
        // Api for cms_paxsente
        router.post('/cms_paxsente', adminController.cms_paxsente)
        // Api for get_cms_paxSente
        router.get('/get_cms_paxSente', adminController.get_cms_paxSente)

        module.exports = router