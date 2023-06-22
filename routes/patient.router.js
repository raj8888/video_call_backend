const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { patientModel } = require("../models/patient.models")
const {authenticator}=require("../middlewares/authentication.middleware")
const {authorization}=require("../middlewares/authorization.middleware")

const patientRouter = express.Router()

patientRouter.post("/register", async (req, res) => {
    let inputData = req.body
    if (!inputData.email || !inputData.mobile || !inputData.name || !inputData.password || !inputData.role) {
        res.status(400).send({ "message": "Please Fill Complete Information" })
    } else {
        try {
            let ipEmail = inputData.email
            let findData = await patientModel.find({
                $or: [
                    { email: { $regex: ipEmail, $options: 'i' } }, // Case-insensitive email search
                    { mobile: { $regex: inputData.mobile, $options: 'i' } } // Case-insensitive mobile search
                ]
            })
            if (findData.length == 1) {
                res.status(400).send({ "message": "Patient EmailID Already Exist. Please Try Another Email Or Mobile Number." })
            } else {
                let ipPassword = inputData.password
                let createdDate = new Date().toLocaleDateString()
                bcrypt.hash(ipPassword, 5, async (err, hash) => {
                    if (err) {
                        res.status(400).send({ "message": "Sorry :( , Server Error" })
                    } else if (hash) {
                        let patientUser = new patientModel({
                            name: inputData.name,
                            email: inputData.email,
                            mobile: inputData.mobile,
                            createdDate: createdDate,
                            password: hash,
                            sex: inputData.sex,
                            role: inputData.role,
                            age: inputData.age
                        })
                        await patientUser.save()
                        res.status(201).send({ 'message': "Patient Register Successfully!" })
                    } else {
                        res.status(400).send({ "message": "Sorry :( , Server Error" })
                    }
                });

            }

        } catch (error) {
            console.log(error.message)
            res.status(400).send({ "message": "Sorry :( , Server Error" })
        }
    }
})

patientRouter.post("/login",async(req,res)=>{
    let ipData=req.body
    if(!ipData.email || !ipData.password){
        res.status(400).send({"message":"Please Fill All Information."})
    }else{
        try {
        let ipEmail=ipData.email
        let findData=await patientModel.find({email:ipEmail})
          if(findData.length==1){
            bcrypt.compare(ipData.password, findData[0].password, async function(err, result){
                if(err){
                    res.status(400).send({"message":"Please Fill Correct Information."})
                }else if(result){
                    var token = jwt.sign({ userID: findData[0]._id, userRole:findData[0].role, userName:findData[0].name,userEmail:findData[0].email }, process.env.seckey);
                    res.status(201).send({'message':"Patient Login Successfully!",'VideoAppToken':token,userEmail:findData[0].email})
                }else{
                    res.status(400).send({"message":"Please Fill Correct Information."})
                }
            })
          }else{
            res.status(400).send({"message":"Please Enter Valid Information"})
          }
        } catch (error) {
            console.log(error.message)
            res.status(400).send({"message":"Sorry :( , Server Error"})
        }
    }
})

patientRouter.use(authenticator)

patientRouter.get("/all",authorization(['admin']),async(req,res)=>{
    try {
            let allPatients=await patientModel.find()
            res.status(201).send({'message':"Information of all Patient",'allPatients':allPatients})
    } catch (error) {
            console.log(error.message)
            res.status(400).send({"message":"Sorry :( , Server Error"})
    }
})

patientRouter.get("/single/:patientID",authorization(['admin','doctor']),async(req,res)=>{
    try {
            let patientID=req.params.patientID
            let patientData=await patientModel.findById(patientID)
            res.status(201).send({'message':"Information of patient",'patientData':patientData})
    } catch (error) {
            console.log(error.message)
            res.status(400).send({"message":"Sorry :( , Server Error"})
    }
})

module.exports={
    patientRouter
}