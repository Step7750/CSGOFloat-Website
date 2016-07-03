var socket = io.connect('api.csgofloat.com:1738');

function lookup() {
  var lookup_string = decodeURIComponent($('#input_url').val());

  // check whether the structure is valid, this doesn't mean that it is necessarily valid though
  var regexed = lookup_string.match(/steam:\/\/rungame\/730\/\d*\/\+csgo_econ_action_preview [SM]\d*[A]\d*[D]\d*/g);

  // this is obviously also checked on the server, since some kid is going to think they can send malformed requests

  if (regexed != null && regexed == lookup_string) {
    // this is most likely a valid inspect link structure (afaik, still to be confirmed)
    //console.log("sending lookup");
    socket.emit('lookup', lookup_string);
    $('#input_url').val('');
  }
  else {
    data = '<div class="alert alert-info" role="alert">You must insert a valid inspect link of the form <br>steam://rungame/730/xxxxxxxxxxx/+csgo_econ_action_preview AxxxxxxxxBxxxxxxxxCxxxxxxxx</div>';
    $(data).hide().prependTo("#messages").slideDown("slow");
    $('#input_url').val('');
  }
}

socket.on("joined", function() {
    data = '<div class="alert alert-success" role="alert">Successfully joined the server</div>';
    $(data).hide().prependTo("#messages").slideDown("slow");
});

socket.on("successmessage", function(msg) {
    data = '<div class="alert alert-success" role="alert">' + msg +'</div>';
    $(data).hide().prependTo("#messages").slideDown("slow");
});

socket.on("infomessage", function(msg) {
    data = '<div class="alert alert-info" role="alert">' + msg +'</div>';
    $(data).hide().prependTo("#messages").slideDown("slow");
});

socket.on("warningmessage", function(msg) {
    data = '<div class="alert alert-warning" role="alert">' + msg +'</div>';
    $(data).hide().prependTo("#messages").slideDown("slow");
});

socket.on("errormessage", function(msg) {
    data = '<div class="alert alert-danger" role="alert">' + msg +'</div>';
    $(data).hide().prependTo("#messages").slideDown("slow");
});

socket.on('disconnect', function() {
  data = '<div class="alert alert-danger" role="alert">Disconnected from server, trying to reconnect</div>';
  $(data).hide().prependTo("#messages").slideDown("slow");
});

wear_ranges = [[0.00, 0.07], [0.07, 0.15], [0.15, 0.38], [0.38, 0.45], [0.45, 1.00]];
wear_names = ["Factory New", "Minimal Wear", "Field-Tested", "Well-Worn", "Battle-Scarred"];

socket.on("floatmessage", function(itemdata) {
    itemdata = itemdata["iteminfo"];
    console.log(itemdata);

    min = parseFloat(itemdata["min"]);
    max = parseFloat(itemdata["max"]);

    // find out the wear range
    wear_range = [0, 0];

    offset = [0, 0] // percentage to offset the bar
    wear_name = "";
    float_offset = 0

    float_val = itemdata["floatvalue"];

    for(var i in wear_ranges) {
      if (wear_ranges[i][0] < float_val && float_val < wear_ranges[i][1]) {

        wear_name = wear_names[i];
        if (wear_ranges[i][0] < min) {
          wear_range[0] = min;
          offset[0] = ((min - wear_ranges[i][0]) / (wear_ranges[i][1] - wear_ranges[i][0])) * 100;
        }
        else {
          wear_range[0] = wear_ranges[i][0];
        }

        if (wear_ranges[i][1] > max) {
          wear_range[1] = max;
          offset[1] = ((max - wear_ranges[i][0]) / (wear_ranges[i][1] - wear_ranges[i][0])) * 100;
        }
        else {
          wear_range[1] = wear_ranges[i][1];
        }
        //console.log(wear_range);
        float_offset = ((float_val - wear_range[0]) / (wear_range[1] - wear_range[0])) * 100;
        break;
      }
    }
    progress_bar = '<div style="position: relative;"><div class="progress"><div class="progress-bar progress-bar-success progress-bar-striped active" style="margin-left: 0%; width: 100%;">' + wear_name + '</div></div>';
    progress_bar += '<div style="width: 5px; height: 20px; position: absolute; background: red; top: 0; left: ' + float_offset + '%;" title="' + float_val +'"></div>'
    progress_bar += '<div style="position: absolute; top: 20px; left: 0;">' + wear_range[0] + '</div>';
    progress_bar += '<div style="position: absolute; top: 20px; right: 0;">' + wear_range[1] + '</div>';

    progress_bar += '</div>'
    data = '<div class="alert alert-info" role="alert" style="min-height: 150px;" id="' + itemdata["itemid_int"] + '_success">'+ progress_bar 

    itemname = generateItemName(itemdata) + " (" + wear_name + ")";

    data += generateItemHTML(itemdata, itemname, wear_name) + '</div>';


    $(data).hide().prependTo("#messages").show();

    $("[title]").tooltip({'placement': "bottom"});
});

function generateItemHTML(itemdata, itemname, wear_name) {
  innerHTML = ''

  if (itemdata["imageurl"] != null) {
    innerHTML += '<img src="' + itemdata["imageurl"] + '" height="150px" style="float: left; margin-top: -10px;"></br><div style="text-align: left; margin-top: -15px; padding-left: 210px;">';
  }
  innerHTML += '<div class="itemname">' + itemname + "</div>";
  innerHTML += '<div class="float_val">Float Value: ' + itemdata["floatvalue"] + '</div>';

  innerHTML += 'Paint Index: ' + itemdata["paintseed"];
  innerHTML += '<br>Item ID: ' + itemdata["itemid_int"];

  innerHTML += '<br><a href="' + generateInspectURL(itemdata) + '" class="btn btn-info">Inspect in Game</a>';

  return innerHTML;
}

function generateInspectURL(itemdata) {
  url = "";

  if (itemdata["s"] == "0") {
    url = "steam://rungame/730/76561202255233023/+csgo_econ_action_preview M" + itemdata["m"] + "A" + itemdata["a"] + "D" + itemdata["d"];
  }
  else {
    url = "steam://rungame/730/76561202255233023/+csgo_econ_action_preview S" + itemdata["s"] + "A" + itemdata["a"] + "D" + itemdata["d"];
  }

  return url;
}

function generateItemName(itemdata) {
  itemname = ""
  if (itemdata["defindex"] >= 500) {
    // this is a knife, add the star symbol
    itemname += "★ ";
  }
  if (itemdata["killeatervalue"] != null) {
    itemname += "StatTrak™ ";
  }
  itemname += itemdata["weapon_type"];
  if (itemdata["item_name"] != "-") {
    itemname += " | " + itemdata["item_name"];
  }

  return itemname;

}

$('#input_url').keypress(function (e) {
  if (e.which == 13) {
    lookup();
    e.preventDefault();
  }
});
