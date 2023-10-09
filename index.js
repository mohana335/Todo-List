import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";
import { today } from "./date.js";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect('mongodb+srv://mohanarahman335:PHnqy7pyKZwiNThP@cluster0.laip88f.mongodb.net/todolistDB')
        .then(() => console.log("Database connected!"))
        .catch(err => console.log(err));


const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Empty item!"]
  }
});
const Item = mongoose.model("Item", itemsSchema);

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});
const List = mongoose.model("List", listSchema);

const defaultItems = [];
      
app.get("/", function(req, res) { 
  Item.find()
  .then(function (foundItems) {
    if(foundItems.length != 0){
      res.render("list", {listTitle: today, newListItems: foundItems});
    }
    else{
      res.render("list", {listTitle: today});
    }
  })
  .catch(function (err) {
      console.log(err);
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  
  List.findOne({name: customListName })
      .then(function (foundList) {
        if(!foundList){
          //create a new list
          const list = new List({
            name: customListName,
            items: defaultItems
          });        
          list.save();
          res.redirect("/" + customListName);        
        }else {
          //show the exixting list
          res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }
      })
      .catch(function (err) {
        console.log(err);
      });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({ 
    name: itemName 
  });

  if (listName === today) {
    item.validate()
    .then(function() {
      item.save();
      res.redirect("/");

    })
    .catch(function(err){
      console.log(err.errors.name.message);
      res.redirect("/");
    })
  } else {
    List.findOne({name: listName})
        .then(function (foundList) {
          foundList.items.push(item);
          foundList.save()
                    .then( function () {
                      res.redirect("/" +listName);
                    })
                    .catch(function(err) {
                      console.log(err);
                    });
        })
        .catch(function(err) {
          console.log(err);
        });
    //res.redirect("/" +listName);
  }
});

app.post("/delete", function(req,res) {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === today){
    Item.findByIdAndDelete(checkedItemID)
      .then(function () {
        res.redirect("/");
      })
      .catch(function (err) {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate({name: listName}, { $pull: { items: {_id: checkedItemID} } })
      .then(function (foundlist) {
        res.redirect("/" +listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }

});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
