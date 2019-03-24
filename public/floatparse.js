const bannerImages = ['public/money1.png', 'public/money2.png', 'public/money3.png'];
$('#banner').attr('src', bannerImages[Math.floor(Math.random()*bannerImages.length)]);

const socket = io.connect('https://api.csgofloat.com');

const wear_ranges = [[0.00, 0.07], [0.07, 0.15], [0.15, 0.38], [0.38, 0.45], [0.45, 1.00]];
const wear_names = ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred'];

$('#input_url').keypress((e) => {
    if (e.which === 13) {
        lookup();
        e.preventDefault();
    }
});

let data = '<div class="alert alert-info" role="alert">Trying to join the API server...</div>';
$(data).hide().prependTo('#messages').slideDown('slow');

socket.on('joined', () => {
    let data = '<div class="alert alert-success" role="alert">Successfully joined the server</div>';
    $(data).hide().prependTo('#messages').slideDown('slow');
});

socket.on('successmessage', (msg) => {
    let data = `<div class="alert alert-success" role="alert">${msg.msg}</div>`;
    $(data).hide().prependTo('#messages').slideDown('slow');
});

socket.on('infomessage', (msg) => {
    let data = `<div class="alert alert-info" role="alert">${msg.msg}</div>`;
    $(data).hide().prependTo('#messages').slideDown('slow');
});

socket.on('errormessage', (msg) => {
    let data = `<div class="alert alert-danger" role="alert">${msg.error}</div>`;
    $(data).hide().prependTo('#messages').slideDown('slow');
});

socket.on('disconnect', () => {
    let data = '<div class="alert alert-danger" role="alert">Disconnected from server, trying to reconnect</div>';
    $(data).hide().prependTo('#messages').slideDown('slow');
});

socket.on('floatmessage', (itemdata) => {
    itemdata = itemdata.iteminfo;

    let min = parseFloat(itemdata.min);
    let max = parseFloat(itemdata.max);

    // find out the wear range
    let wear_range = [0, 0];
    let float_val = itemdata.floatvalue;

    // Calculate offsets and wear range
    for (let i in wear_ranges) {
        let lower_bound = wear_ranges[i][0];
        let upper_bound = wear_ranges[i][1];

        if (float_val >= lower_bound && float_val < upper_bound) {
            wear_range[0] = lower_bound < min ? min : lower_bound;
            wear_range[1] = upper_bound > max ? max : upper_bound;

            var wear_name = wear_names[i];
            var float_offset = ((float_val - wear_range[0]) / (wear_range[1] - wear_range[0])) * 100;

            break;
        }
    }

    let itemname = `${generateItemName(itemdata)} (${wear_name})`;

    let data = `
        <div class='alert alert-info' role='alert' style='min-height: 150px;' id='${itemdata.itemid_int}_success'>
            <div style='position: relative;'>
                <div class='progress'>
                    <div class='progress-bar progress-bar-success progress-bar-striped active' style='margin-left: 0%; width: 100%;'>
                        ${wear_name}
                    </div>
                </div>
                <div style='width: 5px; height: 20px; position: absolute; background: red; top: 0; left: ${float_offset}%;' title='${float_val}'></div>
                <div style='position: absolute; top: 20px; left: 0;'>${wear_range[0].toFixed(2)}</div>
                <div style='position: absolute; top: 20px; right: 0;'>${wear_range[1].toFixed(2)}</div>
            </div>
            ${generateItemHTML(itemdata, itemname, wear_name)}
        </div>
    `;

    $(data).hide().prependTo('#messages').show();

    $('[title]').tooltip({'placement': 'bottom'});
});

const lookup = function() {
    let lookup_string = decodeURIComponent($('#input_url').val());

    // Check proper structure client side
    let regexed = lookup_string.match(/^steam:\/\/rungame\/730\/\d+\/[+ ]csgo_econ_action_preview [SM]\d+A\d+D\d+$/g);

    if (regexed && regexed[0] === lookup_string) socket.emit('lookup', lookup_string);
    else {
        data = `
        <div class='alert alert-info' role='alert'>
            You must insert a valid inspect link of the form <br>
            steam://rungame/730/xxxxxxxxxxx/+csgo_econ_action_preview AxxxxxxxxBxxxxxxxxCxxxxxxxx
        </div>`;

        $(data).hide().prependTo('#messages').slideDown('slow');
    }

    $('#input_url').val('');
}

const generateItemHTML = function(itemdata, itemname, wear_name) {
    let img_html = '';

    if (itemdata.imageurl) {
        img_html = `
            <img src='${itemdata.imageurl}' height='150px' style='float: left; margin-top: -10px;'>
            </br>
            <div style='text-align: left; margin-top: -15px; padding-left: 210px;'>
        `;
    }

    return `
        ${img_html}
        <div class='itemname'>${itemname}</div>
        <div class='float_val'>Float Value: ${itemdata.floatvalue}</div>
        Paint Seed: ${itemdata.paintseed}</br>
        Item ID: ${itemdata.itemid}</br>
        <a href='${generateInspectURL(itemdata)}' class='btn btn-info'>Inspect in Game</a>
    `;
}

const generateInspectURL = function(item) {
    if (item.s === '0') return `steam://rungame/730/76561202255233023/+csgo_econ_action_preview M${item.m}A${item.a}D${item.d}`;
    else return `steam://rungame/730/76561202255233023/+csgo_econ_action_preview S${item.s}A${item.a}D${item.d}`;
}

const generateItemName = function(itemdata) {
    let itemname = '';

    if (itemdata.defindex >= 500) {
        // this is a knife, add the star symbol
        itemname += '★ ';
    }
    if (itemdata.killeatervalue !== null) {
        itemname += 'StatTrak™ ';
    }

    itemname += itemdata.weapon_type;

    if (itemdata.item_name !== '-') {
        itemname += ' | ' + itemdata.item_name;
    }

    return itemname;
}
