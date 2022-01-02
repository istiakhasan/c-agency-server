
const express = require('express')
const app = express()
var bodyParser = require('body-parser')
var cors = require('cors')
app.use(cors())
const Objectid=require('mongodb').ObjectId;//object id import
//file system
const fs=require('fs-extra')


require('dotenv').config()
const { MongoClient } = require('mongodb');
const fileUpload = require('express-fileupload')

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7t1w1.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const port=4000
app.use(express.static('order'))
app.use(fileUpload())
app.use(bodyParser.json())


app.use(bodyParser.urlencoded({ extended: false }))




client.connect(err => {
  const OrderCollection = client.db(process.env.DB_NAME).collection("order");
  const AdminCollection = client.db(process.env.DB_NAME).collection("admin");
  const serviceCollection = client.db(process.env.DB_NAME).collection("service");
  const feedbackCollection = client.db(process.env.DB_NAME).collection("clientfeedback");



  app.post('/makeAdmin',(req,res)=>{
     
     AdminCollection.insertOne(req.body)
     .then(result=>{
      res.send(result.acknowledged===true)
     })
  })

  app.get('/allservices',(req,res)=>{
    
     serviceCollection.find({})
     .toArray((err,document)=>{
       res.send(document)
     })
  })


  app.post('/addservices',(req,res)=>{    
    const file=req.files.file
    const title=req.body.title
    const desc=req.body.desc
    const filepath=`${__dirname}/serviceicon/${file.name}`
    file.mv(filepath,err=>{
      if(err){
       return res.status(500).send({msg:"faild to load image"})
      }

      const newImg=fs.readFileSync(filepath)
      const encImg=newImg.toString('base64')

      var Image={
        contentType:req.files.file.mimetype,
        size:req.files.file.size,
        img:Buffer(encImg,'base64')
      }
      serviceCollection.insertOne({title,desc,Image})
      .then(result=>{
        fs.remove(filepath,err=>{
          if(err){console.log(err)}
        })
        res.send(result.acknowledged===true)
      })
    })
    console.log(file,title,desc)
  })

  //table all service 

  app.post('/servicelist',(req,res)=>{
     const email=req.body.email
     
     
      AdminCollection.find({email:email})
      .toArray((err,admin)=>{
        const filter={}
        if(admin.length===0){
           filter.email=email
        }
         OrderCollection.find(filter)
        .toArray((err,alldocument)=>{
          res.send(alldocument)
        })
        
      }) 
  
  })


  //table all service end
  
  app.post('/addorder',(req,res)=>{
   

    const file=req.files.file
    const name=req.body.name
    const email=req.body.email
    const title=req.body.title
    const desc=req.body.desc
    const price=req.body.price
    const status="pending"
    
    const filepath=`${__dirname}/order/${file.name}`;
    
    console.log("req body=",req.body)

    const newImg=file.data
    const encImg=newImg.toString('base64')
    var image={
      contentType:file.mimetype,
      size:file.size,
      img:Buffer.from(encImg,'base64')
    }
    OrderCollection.insertOne({name,email,title,desc,price,image,status})
    .then(result=>{
      res.send(result.acknowledged===true)
    })

    
    
    //  file.mv(filepath,err=>{
    //    if(err){
    //      console.log(err)
    //      return res.status(500).send({msg:"Faild to upload image"})
    //    }
    //    const newImg=fs.readFileSync(filepath)
    //    const encImg=newImg.toString('base64')
    //    var image={
    //      contentType: req.files.file.mimetype,
    //      size:req.files.file.size,
    //      img:Buffer(encImg,'base64')
  
    //    }
    //    OrderCollection.insertOne({name,email,title,desc,price,image,status})
    //    .then((result=>{
    //      res.send(result.acknowledged===true)
    //      fs.remove(filepath,error=>{
    //        if(error){console.log(error)}
    //      })
    //    }))
       
       
      
    //   })
  
})


//customer feedback
app.post('/postfeedback',(req,res)=>{
      feedbackCollection.insertOne(req.body)
      .then(result=>{
        res.send(result.acknowledged===0)
      })
     
})

app.get('/getfeedbacks',(req,res)=>{
   feedbackCollection.find({})
   .toArray((err,document)=>{
     res.send(document)
   })
})


app.post('/admincheck',(req,res)=>{
     
     AdminCollection.find({email:req.body.email})
     .toArray((err,document)=>{
       res.send(document.length>0)
     })
})


app.patch('/update-status', (req, res) => {
  console.log(req.body)
  OrderCollection.updateOne(
    { _id: Objectid(req.body.id) },
    { $set: { 'status': req.body.status } }
  )
    .then(result => {
      res.send(result.modifiedCount > 0)
    })
    .catch(err => console.log(err))
})


});






app.listen(process.env.PORT || port,err=>{
  console.log("port start successfully")
})




