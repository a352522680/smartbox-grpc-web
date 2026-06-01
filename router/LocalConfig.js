var Express = require('express');
//创建路由
var router=Express.Router();

var fs = require('fs');
router.get('/update',(req,res)=>{
    var str="";
    var parms=req.query.jsons;
    var parm=JSON.parse(parms);
    console.log(parm)
    fs.readFile('./LocalConfig.json',function(err,data){
        var person = data.toString();
        person = JSON.parse(person);
        //把数据读出来,然后进行修改//
        for(var j=0;j<parm.length;j++){
            for(var i = 0; i < person.data.length;i++){
                if(parm[j].id==person.data[i].id){
                    person.data[i].status=parm[j].status
                    break;
                }
            }
        }

        fs.writeFile('./LocalConfig.json', JSON.stringify(person), 'utf8', (err) => {
            if (err) {
              str="0";
              console.error(err);
            } else {
              str="1";
              console.log('JSON文件内容已成功修改！');
            }
            res.send(str);
        });

    })
})
router.get('/updatePlanFact', (req, res) => {
    var str = "";
    var plan = req.query.Plan;
    var fact = req.query.fact;
    
    fs.readFile('./LocalConfig.json', function(err, data) {
        if (err) {
            console.error(err);
            res.send("0");
            return;
        }
        
        var person = data.toString();
        person = JSON.parse(person);
        
        // 修改 Plan 和 fact
        person.Plan = plan;
        person.fact = fact;
        
        fs.writeFile('./LocalConfig.json', JSON.stringify(person), 'utf8', (err) => {
            if (err) {
                str = "0";
                console.error(err);
            } else {
                str = "1";
                console.log('Plan 和 fact 已成功修改！');
            }
            res.send(str);
        });
    });
});
router.get('/read',(req,res)=>{
    fs.readFile('./LocalConfig.json',function(err,data){
        var person = data.toString();
        person = JSON.parse(person);
        res.send(person);
    })
})
router.get('/edit',(req,res)=>{
    var str="";
    var parms=req.query.jsons;
    var parm=JSON.parse(parms);

    fs.readFile('./LocalConfig.json',function(err,data){
        var person = data.toString();
        person = JSON.parse(person);

        //把数据读出来,然后进行修改//
        person.MachineName=parm[0].MachineName;
        
        fs.writeFile('./LocalConfig.json', JSON.stringify(person), 'utf8', (err) => {
            if (err) {
              str="0";
              console.error(err);
            } else {
              str="1";
              console.log('JSON文件内容已成功修改！');
            }
            res.send(str);
        });
        

    })
})
router.get('/editTime',(req,res)=>{
    var str="";
    var parms=req.query.jsons;
    var parm=JSON.parse(parms);
    fs.readFile('./LocalConfig.json',function(err,data){
        var person = data.toString();
        person = JSON.parse(person);
        //把数据读出来,然后进行修改//
        person.STime=parm[0].Time;
        person.ETime=parm[0].Time;
        fs.writeFile('./LocalConfig.json', JSON.stringify(person), 'utf8', (err) => {
            if (err) {
              str="0";
              console.error(err);
            } else {
              str="1";
              console.log('JSON文件内容已成功修改！');
            }
            res.send(str);
        });
        
    })
})
module.exports=router