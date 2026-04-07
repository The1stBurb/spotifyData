function mainParse(){
    // console.log("is worky")
    const fs=require('fs');
    const year="2025"
    const yearDat=JSON.parse(fs.readFileSync(`dat/${year}.json`, "utf8"));
    function convTime(timestamp){
        let time=new Date(timestamp);
        // let times2=timestamp.replace("Z","").split("T")
        // console.log(times2,timestamp)
        // let date2=times2[0].split("-")
        // let time2=times2[1].split(":")
        // console.log(time.toString())
        return {"year":time.getUTCFullYear(),"month":time.getUTCMonth()+1,"day":time.getUTCDate(),"hour":time.getUTCHours(),"min":time.getUTCMinutes(),"sec":time.getUTCSeconds(),}
    }
    function normTimeToMS(time){
        return (((time.hour*60)+time.min)*60+time.sec)*1000
    }

    class Song{
        constructor(dat){
            this.track=dat.master_metadata_track_name
            this.artist=dat.master_metadata_album_artist_name
            this.albumn=dat.master_metadata_album_album_name
            this.ms_played=dat.ms_played
        }
    }
    class SongTot{
        constructor(song){
            this.song=song
            this.len=song.ms_played
        }
        addSong(song){
            if(this.song.track==song.track){
                this.len+=song.ms_played
            }
        }
    }

    function removeMinSec(dat){
        // delete dat.min
        // delete dat.sec
        return dat
    }
    class HourBit{
        constructor(time){
            this.ts=time.ts//removeMinSec(time.ts)
            this.rts=[[time.rts,new Date(time.rts).toString()]]
            // this.timeStamps=[ts]
            this.songs=[...time.songs]
        }
        isSameTime(odat){
            if(this.ts.month==odat.ts.month&&this.ts.day==odat.ts.day&&this.ts.hour==odat.ts.hour){
                return true
                // console.log(this.hour,odat.ts.hour,odat.rts)
                
            }
            return false
        }
        addTimeStamp(odat){
            this.songs=[...this.songs,...odat.songs]
            this.rts.push([odat.rts,new Date(odat.rts).toString()])
        }
        alltime(){
            let time=0;
            for(let i in this.songs){
                time+=this.songs[i].ms_played
            }
            return {"month":this.ts.month,"day":this.ts.day,"hour":this.ts.hour,"len":time,"rts":this.rts}
        }
    }

    class timeStamp{
        constructor(dat){
            this.rts=dat.ts
            this.ts=convTime(dat.ts)//end of playing
            this.tms=normTimeToMS(this.ts)
            this.ms_played=parseInt(dat.ms_played)
            this.combos=[]
            this.songs=[new Song(dat)]
        }
        isSameTime(odat){
            if(Math.abs((odat.tms-odat.ms_played)-this.tms)<1000){
                return true
            }
            return false
        }
        addMS(odat){
            this.combos.push(this.ms_played)
            this.songs=[...odat.songs,...this.songs]
            this.ms_played+=odat.ms_played
            return this
        }
    }

    let data={"hourly":[],"time_hr":[],"song_tot":{}}
    for(let i in yearDat){
        let elm=yearDat[i]
        let asts=new timeStamp(elm);
        let last=data.hourly.length>0?data.hourly[data.hourly.length-1]:false
        if(last&&last.isSameTime(asts)){
            last.addTimeStamp(asts)
            // data[data.length-1]=asts.addMS(last)
        }
        else{
            data.hourly.push(new HourBit(asts))
        }
    }
    let maxd=[-1,0]
    for(let i in data.hourly){
        // console.log(typeof i)
        let songs=data.hourly[i].songs
        for(j in songs){
            let track=songs[j].track;
            if(data.song_tot.hasOwnProperty(track)){
                data.song_tot[track].len+=songs[j].ms_played
            }
            else{
                data.song_tot[track]={"track":songs[j].track,artist:songs[j].artist,albumn:songs[j].albumn,len:songs[j].ms_played}
            }
        }
        data.time_hr.push(data.hourly[i].alltime())
        // console.log(data.time_hr[i])
        if(data.time_hr[data.time_hr.length-1].len>maxd[1]){
            // console.log(data.time_hr[i])
            maxd=[i,data.time_hr[data.time_hr.length-1].len]
        }
    }
    // let s=""
    // for(let i in data.time_hr){
    //     let cur=data.time_hr[i]
    //     let t=Math.round((cur.len/maxd[1])*30)
    //     s+=`<div><span class="title">${cur.month}/${cur.day} - ${cur.hour}</span><span class="time">${Math.round(cur.len/(1000*60))} hours</span></div>`
    //     // console.log(`${cur.month}/${cur.day}-${cur.hour} ${"#".repeat(t)}`)
    // }
    // document.getElementById("main").innerHTML=s
    fs.writeFileSync(`condDat/${year}.json`, JSON.stringify(data,"",2));
}
function makeBar(name,size,text){
    return `
    <div id="week_${name}" class="main_bar">
        <div id="week_${name}_bar" class="sub_bar" style="height:${size}px"></div>
        <span id="week_${name}_text">${text}</span>
    </div>`
}
function createChart(labels,values){
    const ctx = document.getElementById('main');

    new Chart(ctx, {
    type: 'line',
    data: {
        labels: labels,
        datasets: [{
        label: 'Minutes Listened',
        data: values,
        borderWidth: 2,
        fill:true,
        cubicInterpolationMode:"monotone",
        }]
    },
    options: {
        plugins:{
            tooltip:{
                enabled:true,
            },
        },
        scales: {
        y: {
            beginAtZero: true
        }
        }
    }
    });
}
function getWeek(date) {
  let d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  
  // Set to nearest Thursday
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  
  let yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  
  let weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  
  return weekNo;
}
function getWeekRange(date) {
  let d = new Date(date);

  // get day (0 = Sunday, 6 = Saturday)
  let day = d.getDay();

  // convert Sunday (0) to 7 for ISO
  if (day === 0) day = 7;

  // get Monday
  let start = new Date(d);
  start.setDate(d.getDate() - day + 1);

  // get Sunday
  let end = new Date(start);
  end.setDate(start.getDate() + 6);

  return { start, end };
}
function getWeekFromNum(year, week) {
  // Start from Jan 4 (always in week 1)
  let d = new Date(Date.UTC(year, 0, 4));

  // Move to the correct week
  d.setUTCDate(d.getUTCDate() + (week - 1) * 7);

  // Find Monday of that week
  let day = d.getUTCDay() || 7;
  let start = new Date(d);
  start.setUTCDate(d.getUTCDate() - day + 1);

  // Sunday
  let end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);

  return { start, end };
}
function formatWeeks(date){
    date=date.toDateString().split(" ")
    return `${date[1]} ${date[2]}`
}
function retTS(dat){return {"month":dat.month,"day":dat.day}}

function linearRegression(data) {
  let n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  data.forEach(p => {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  });

  let slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  let intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}
function generateLine(data, slope, intercept) {
  return data.map(p => ({
    x: p.x,
    y: slope * p.x + intercept
  }));
}
function calculateR2(data, slope, intercept) {
  let meanY = data.reduce((sum, p) => sum + p.y, 0) / data.length;

  let ssTot = 0;
  let ssRes = 0;

  data.forEach(p => {
    let predicted = slope * p.x + intercept;
    ssTot += (p.y - meanY) ** 2;
    ssRes += (p.y - predicted) ** 2;
  });

  return 1 - (ssRes / ssTot);
}
function getLinR2(dat){
    let { slope, intercept } = linearRegression(dat);
    let line = generateLine(dat, slope, intercept);
    // let r2 = calculateR2(data, slope, intercept);
    return line
}
function getId(id){return document.getElementById(id)}
let totalMin=0
function mainDisp(data){
    let maxd=0
    data.time_hr.forEach(elm=>{
        if(elm.len>maxd){
            maxd=elm.len
        }
    })
    let newVals=[]
    let weeks=[]
    data.time_hr.forEach(elm=>{
        // console.log(elm)
        let dat=new Date(elm.rts[elm.rts.length-1][0])
        let curElm={week:getWeek(dat),ts:[retTS(elm)],len:elm.len,date:elm.rts[0][0]}
        let matched=false
        for(let i in newVals){
            let last=newVals[i]
            if(last.week==curElm.week){
                // console.log(curElm.ts,curElm.week,last.week)
                newVals[i]={week:last.week,ts:[...last.ts,...curElm.ts],len:last.len+elm.len,date:last.date}
                if(newVals[i].len>maxd){maxd=newVals[i].len}
                matched=true
                break
            }
        }
        if(!matched){
            weeks.push(curElm.week)
            newVals.push(curElm)
        }
    })
    
    let i=0;
    let labels=[]
    let values=[]
    for(let i=0; i<52; i++){
        !weeks.includes(i+1)?newVals.push({week:i+1,ts:[],len:0}):false
    }
    newVals.sort((a,b)=>a.week-b.week)
    let weeksListened=0
    newVals.forEach(cur=>{
        if(cur.len!=0){weeksListened++}
        let t=Math.round((cur.len/maxd)*30)
        weekdays=getWeekFromNum(yearChosen,cur.week)
        labels.push(formatWeeks(weekdays.start)+" - "+formatWeeks(weekdays.end))
        values.push(Math.round(cur.len/60000))
        i++;
    })
    createChart(labels,values)

    let tlabels=[]
    let tvals=[]
    let taps=[]
    // data.song_tot.sort((a, b) => a.len - b.len);
    let maxl=0
    let opts=""
    totalMin=0
    for(let i in data.song_tot){
        let cur=data.song_tot[i]
        taps.push([i,Math.round(cur.len/60000*100)/100])
        // if(cur.len){}
        totalMin+=cur.len
        if(taps[taps.length-1][1]>maxl){maxl=taps[taps.length-1][1]}
    }
    timesyr[yearChosen]=totalMin
    document.getElementById("songLen").innerHTML=opts
    // totalMin=msToNormTime(totalMin)
    document.getElementById("totalMinutesAmnt").textContent=formatTime(msToNormTime(totalMin))
    document.getElementById("totalMinAmnt").textContent=Math.round(totalMin/60000).toLocaleString()
    let totest=(totalMin/weeksListened)*52
    timesyrall[yearChosen]=totest
    document.getElementById("estimate").textContent=Math.round(totest/60000).toLocaleString()
    getId("weekslisten").textContent=weeksListened
    getId("estimateAmnt").textContent=formatTime(msToNormTime(totalMin))
    taps.sort((a,b)=>a[1]-b[1])
    taps.forEach(elm=>
        opts+=`<option value="${elm[0].replaceAll(" ","_")}">${elm[0]}</option>`)
    document.getElementById("songLen").innerHTML=opts
    // if(taps.length>10){}
    taps.filter(a=>a[1]>maxl/3).forEach(elm=>{tlabels.push(elm[0]);tvals.push(elm[1]);})
    // data.song_tot.forEach(cur=>{
    //     tlabels.push(cur.track)
    //     tvals.push(Math.round(cur.len/60000))
    // })
    new Chart(document.getElementById("timePerSong"), {
        type: 'line',
        data: {
            labels: tlabels,
            datasets: [{
            label: 'Minutes Listened Per Song',
            data: tvals,
            borderWidth: 2,
            fill:true,
            cubicInterpolationMode:"monotone",
            }]
        },
        options: {
            plugins:{
                tooltip:{
                    enabled:true,
                },
            },
            scales: {
            y: {
                beginAtZero: true
            }
            }
        }
    });
    let otkeys=Object.keys(timesyr).map(val=>parseInt(val))
    let otvals=Object.values(timesyr).map(val=>Math.round(val/60000))
    let ndat=[]
    for(let i in otkeys){
        ndat.push({x:otkeys[i],y:otvals[i]})
    }
    new Chart(document.getElementById("overTime"), {
        type: 'line',
        data: {
            labels: otkeys,
            datasets: [
                {
                    label: 'Minutes Listened Per Year',
                    data: otvals,
                    borderWidth: 2,
                    // backgroundColor:"blue",
                    // borderColor:"blue",
                    fill:true,
                    cubicInterpolationMode:"monotone",
                    // regression: {
                    //     type: 'linear',
                    //     color: 'red',
                    //     lineWidth: 2
                    // }
                },
                {
                    label: 'Best Fit',
                    data: getLinR2(ndat),
                    // type: 'line',
                    borderColor: 'red',
                    fill: false
                }
            ]
        },
        options: {
            plugins:{
                tooltip:{
                    enabled:true,
                },
            },
            scales: {
            y: {
                beginAtZero: true
            }
            }
        }
    });
    getId("totalMinutes").textContent=otvals.reduce((acc,val)=>acc+val,0).toLocaleString()
    getId("totalMinutesAll").textContent=Object.values(timesyrall).map(val=>Math.round(val/60000)).reduce((acc,val)=>acc+val,0).toLocaleString()
    // document.getElementById("main").innerHTML=s

}
// let data;
function formatTime({ hour, min, sec }) {
  return (
    hour.toLocaleString()+ ":" +
    String(min).padStart(2, "0") + ":" +
    String(sec).padStart(2, "0")
  );
}
function msToNormTime(ms) {
  let totalSeconds = Math.floor(ms / 1000);
  let hour = Math.floor(totalSeconds / 3600);
  let min = Math.floor((totalSeconds % 3600) / 60);
  let sec = totalSeconds % 60;

  return { hour, min, sec };
}
function getSongLen(title){
    title=title.replaceAll("_"," ")
    // console.log(data.song_tot[title])
    // let ms=data.song_tot[title].len
    // let s=data.song_tot[title].len/1000
    // let m=Math.floor(s/60)
    return formatTime(msToNormTime(data.song_tot[title].len))
}
function getSongLenPerc(title){
    title=title.replaceAll("_"," ")
    return (Math.round((data.song_tot[title].len/totalMin)*10000)/100).toFixed(2)
}
function getSongLenEst(title){
    title=title.replaceAll("_"," ")
    let perc=getSongLenPerc(title)
    let val=timesyrall[yearChosen]/timesyr[yearChosen]
    console.log(val)
    val=data.song_tot[title].len*(val)
    console.log(val)
    return formatTime(msToNormTime(val))
}
function fixSongLen(title){
    title=title.replaceAll("_"," ")
    let len=data.song_tot[title].len
    getId("fancyTime2").textContent=formatTime(msToNormTime(len))
    getId("timeListened2").textContent=Math.round(len/60000).toLocaleString()
    let nlen=len*(timesyrall[yearChosen]/timesyr[yearChosen])
    getId("fancyTimeAll2").textContent=formatTime(msToNormTime(nlen))
    getId("timeAll2").textContent=Math.round(nlen/60000).toLocaleString()
    getId("listenedPerc").textContent=(Math.round((len/totalMin)*10000)/100).toFixed(2)
}
// mainParse()
let yearChosen=""
let timesyr={}
let timesyrall={}
function resetter(year){
    yearChosen=year;
    document.getElementById("mainBody").innerHTML=`
    <div id="totalMin">You listened for a total of <span id="totalMinAmnt"></span> minutes in the year ${yearChosen}. (<span id="totalMinutesAmnt"></span>)</div>
    <div>If you had listened for the whole year, you would have approx. <span id="estimate"></span> minutes. (<span id="estimateAmnt"></span>)</div>
    <div>You listened for <span id="weekslisten"></span> / 52 Weeks</div>
    <div>You have listened to a total of <span id="totalMinutes"></span> minutes over all, with <span id="totalMinutesAll"></span> for the Whole Year Estimate.</div>
    <form id="reseter" oninput="resetter(years.value)">
        <select id="years" name="years">
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
        </select>
    </form>
    <canvas id="main"></canvas>
    <form id="eeee" oninput="fixSongLen(songLen.value);">
        <select id="songLen" name="songLen">

        </select><span for="songLen"> => </span>You listened for <div for="songLen"><span id="timeListened2"></span> minutes (<span id="fancyTime2"></span>). This is <span id="listenedPerc"></span>% of your total time. This is <span id="timeAll2"></span> minutes (<span id="fancyTimeAll2"></span>) if you listened all year</div>
    </form>
    <canvas id="timePerSong"></canvas>
    <canvas id="overTime"></canvas>
    `
    document.getElementById("years").value=year
    fetch(`condDat/${year}.json`)
    .then(res => res.json())
    .then(dat => {
        data=dat;
        // console.log(data)
        mainDisp(data);
    });
}
// resetter("2023")