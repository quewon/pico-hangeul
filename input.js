var output = document.getElementById("text-output").getContext("2d");
var text_input = document.getElementById("text-input");

var input_code = [];

function init_input() {
  text_input.addEventListener("keydown", function(e) {
    if (e.keyCode == 32 && e.target == document.body) {
      e.preventDefault();
    }
    
    setTimeout(function(e) {
      type();
    }, 1)
  });
}

function type() {
  let input = text_input.value;
  
  input_code = [];
  for (let i=0; i<input.length; i++) {
    input_code.push(chr.indexOf(input[i]));
  }
  
  draw_output();
}

function draw_output() {
  output.clearRect(0, 0, output.canvas.width, output.canvas.height);
  
  let string = Array.from(new Intl.Segmenter("en", {granularity: 'grapheme'}).segment(update_p8_data().replaceAll("\\0","\0").replaceAll("\\t","\t").replaceAll("\\n","\n").replaceAll("\\r","\r").replaceAll("\\\"","\"").replaceAll("\\\\","\\")), ({segment}) => segment);
  let h = hangeul(input_code);
  let x=1;
  let y=1;
  
  for (let ch of h) {
    for (let ci of ch) { // ci: component index
      if (ch.length == 1 && typeof ci === 'string') {
        output.fillText(ci, x, y+8);
        continue;
      }
      
      // code for one character
      let code = [];
      for (let i=(ci-1)*8; i<=(ci-1)*8+7; i++) {
        code.push(string[i]);
      }
      
      for (let iy=0; iy<=7; iy++) {
        // binary for one row
        let value = chr.indexOf(code[iy]);
        let row = ("000000000" + value.toString(2)).substr(-8);
        let bin = "";
        for (let ii=7; ii>=0; ii--) {
          bin += row[ii];
        }
        
        for (let ix=0; ix<=7; ix++) {
          if (bin[ix] == "1") {
            output.fillRect(x+ix, y+iy, 1, 1);
          }
        }
      }
    }
    x += 9;
    if (x + 8 >= output.canvas.width) {
      x = 1;
      y += 9;
    }
  }
}

function hangeul(code) {
  // indexes of jamo needed
  let blocks = [];
  
  // string data of all characters
  let string = Array.from(new Intl.Segmenter("en", {granularity: 'grapheme'}).segment(update_p8_data().replaceAll("\\0","\0").replaceAll("\\t","\t").replaceAll("\\n","\n").replaceAll("\\r","\r").replaceAll("\\\"","\"").replaceAll("\\\\","\\")), ({segment}) => segment);
  
  let decode = "23,28,80,81,82,83,48,50,51,54,55,21,56,20,24,105,106,107,108,109,110,111,112,132,133,26,27,77,76,78,22,79,6,200,9,8,19,10,14,196,192,189,187,191,198,197,193,195,18,15,7,16,194,13,17,12,199,11,52,25,53,84,104,49,6,200,9,8,5,10,14,196,192,189,187,191,198,197,188,190,4,1,7,2,194,13,3,12,199,11,".split(",");
  decode = decode.reduce( (acc, x ) => acc.concat(+x), []);
  
  let com = [];
  for (let c of code) {
    if (c>=33 && c<=122) {
      com.push(decode[c-33]);
    } else {
      com.push(chr[c]);
    }
  }
  
  let ijv="15,16,0,0,17,0,0,18,19,20,0,0,0,0,21".split(",");
  ijv = ijv.reduce( (acc, x ) => acc.concat(+x), []);
  var ijung = function(a, b) {
    if (a>=196 && a<=198 && b>=187 && b<=191) {
      let iji = (a-196)*5 + (b-187);
      if (ijv[iji]!=0) return ijv[iji]+186;
    }
    return false
  }
  
  var special = function(a) {
    if (a>=20 && a<=28 || a>=48 && a<=56 || a>=76 && a<=84 || a>=104 && a<=112 || a>=132 && a<=140 || a>=250) return true;
    return false;
  }
  
  let ijb="0,176,0,0,0,0,0,0,0,0,0,0,0,0,0,177,0,0,0,0,0,0,0,0,0,0,0,0,0,0,178,0,0,0,0,0,0,0,0,0,0,179,180,181,0,182,0,183,0,0,0,0,0,184,185,186".split(",");
  ijb = ijb.reduce( (acc, x ) => acc.concat(+x), []);
  
  // com[ponents] get parsed into blocks
  // ㄱㅏㄴㅏㄷㅏㄹㅏ => 가나다라
  for (let i=0; i<com.length; i++) {
    let _in = com[i];
    
    if (_in<=19 && typeof _in !== "string") {
      // is consonant
      let b = [];
      
      let current = "choseong";
      b.push(_in);
      
      if (special(_in)) continue;
      
      for (let ii=i+1; ii<com.length; ii++) {
        let iin = com[ii];
        let pre = com[ii-1];
        
        if (current == "choseong") {
          if (pre<=5 && pre==iin) {
            b[0]+=14;
            com[ii] = iin+1;
            i++;
          } else if (iin>19 && !special(iin)) {
            current = "jungseong";
            b[0]+=28;
            if (iin>=196) b[0]+=28;
            b.push(iin+21);
            i++;
          } else {
            break;
          }
        } else if (current == "jungseong") {
          let ij = ijung(pre, iin);
          if (ij) {
            b[0]+=84;
            b[1] = ij+21;
            i++;
          } else if (typeof iin !== "string" && iin<=19 && (ii+1>=com.length || special(com[ii+1]) || com[ii+1]<=19 || typeof com[ii+1] === "string")) {
            // batchim
            current = "batchim";
            b[0]+=56;
            b[1]+=21;
            b.push(iin+159);
            i++;
          } else {
            break;
          }
        } else if (current == "batchim") {
          if (typeof iin !== "string" && iin<=19 && (ii+1>=com.length || special(com[ii+1]) || com[ii+1]<=19 || typeof com[ii+1] === "string")) {
            let iji=Math.ceil((pre-1)/3-1/3)*14+iin-1;
            if (ijb[iji] && ijb[iji]!=0) {
              b[2]=ijb[iji]; i++;
            } else {
              break;
            }
          } else {
            break;
          }
        }
      }
      
      // jamo in b get transformed
      
      blocks.push(b);
    } else { //is vowel
      let ij = ijung(_in, com[i+1]);
      if (ij) {
        blocks.push([ij]);
        i++;
      } else {
        blocks.push([_in]);
      }
    }
  }
  
  return blocks
}