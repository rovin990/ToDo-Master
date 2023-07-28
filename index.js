import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";

const app = express();
const port= 3000;
const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const d = new Date();
const day1 = weekday[d.getDay()];
const month1 =months[d.getMonth()]
const date1 = d.getDate();



app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb://0.0.0.0:27017/todolistDB");
const itemsSchema = mongoose.Schema({
    name:String
});
const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
    name:"Welcome Your ToDo 💕"
})
const item2 = new Item({
    name:"⬅️ hit this to delete ToDo"
})

const defaultItems=[item1,item2];

const listSchema = mongoose.Schema({
    name :String,
    items:[itemsSchema]
})
const List = mongoose.model("List",listSchema);


app.get("/", async(req,res)=>{

    const foundItems = await Item.find({});
    

    if(foundItems.length===0){
        Item.insertMany(defaultItems);
        console.log("Default item saved successfully !");
        
       res.redirect("/");

    }else{
        const allLists = await List.find({},{_id:false,name:true});
        res.render("list.ejs",{listTitle :"Today",newListItems : foundItems,day:day1,month : month1,date : date1,lists: allLists})

    }
})

app.post("/",async(req,res)=>{
    
    var newTODO = req.body.taskType;
    var listName = req.body.listTitle;
   // console.log("Listname : ",listName);
    const item = new Item({
        name:newTODO
    });

    

    if(listName==="Today"){
       // console.log("List is today");
        item.save();
        res.redirect("/");
    }
    else{
        const foundList=await List.findOne({name:listName});
        foundList.items.push(item);
        foundList.save();
       // console.log("listitem ",foundList.items);
        res.redirect("/customeList/"+listName)

    }
})


app.get("/customeList/:listItemName", async(req,res)=>{
    let listName = req.params.listItemName;
    //console.log("listname ",listName)
    listName= listName.charAt(0).toUpperCase()+listName.slice(1);

    let allLists = await List.find({},{_id:false,name:true});
    
    
    const listThatFound=await List.findOne({name:listName});
    if(listThatFound){
        const todoList = await List.find({name:listName},{_id:false,items:true});
        const data=todoList[0].items;
        
        res.render("list.ejs",{listTitle :listName,newListItems : data,day:day1,month : month1,date : date1,lists:allLists})
        
    }else{
        const list = new List({
            name : listName,
            items : defaultItems
        })
        allLists.push({name : listName })
       //rs console.log(allLists);
        list.save();
        res.render("list.ejs",{listTitle :listName,newListItems : defaultItems,day:day1,month : month1,date : date1,lists:allLists})
       // console.log("list not exits . so creating new one ");
    }    
})

app.get("/createCustomeList",async(req,res)=>{
    let allLists = await List.find({},{_id:false,name:true});
    res.render("customeList.ejs",{title:"Custome List",lists:allLists})
})

app.post("/createCustomeList",async(req,res)=>{
    const newListName = req.body.newListName;
    //console.log("new custome list name : ",newListName)
    res.redirect("/customeList/"+newListName);
})

app.post("/deleteTodo",async(req,res)=>{
    const listName = req.body.listTitle;
    const checkedId = req.body.checkedId;
    console.log(req.body)
    // console.log("From Delete  list name : ",listName)
    // console.log("Delete  Task Id : ",checkedId);

    if(listName==="Today"){
        Item.findByIdAndRemove(checkedId);
        console.log(`Task deleted from ${listName}`);
        res.redirect("/");
    }else{

       const foundList= await List.findOneAndUpdate({name:listName},{$pull : {items : {_id : checkedId}}});

       if(foundList.items.length===1){
        await List.deleteOne({name: listName });
        res.redirect("/");
       }
       else{
       res.redirect("/customeList/"+listName);
       }
    }
})

app.listen(port,()=>{
    console.log(`Server is running on ${port} port .`);
})
