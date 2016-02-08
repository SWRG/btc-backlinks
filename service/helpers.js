var app_vars = {server:'',thispageurl:'',provenance:''};
var counter = 0;
var nodes=0;
var rexp = /(.*)\/ranked\//;	// for this to work, the redirector addr must NOT contain "/ranked/"
var rexr = rexp.exec(location.href);
if (rexr.length>0) {
	app_vars.server = rexr[1];
  // this doc's URL *excluding any search param
	app_vars.thispageurl = rexr[1] + "/presentation";
	app_vars.provenance = rexr[1] + "/provenance";
}
function loadContent(uri,bool,checked) {

removediv();
var http = xhr();
if (http) {
	getdbinfo(http, uri, bool, checked); 
}

}
function fetchprovenance() {
var http = xhr();

if (http) {
	getprovenance(http); 
}
}

function getprovenance(http) {
	http.onreadystatechange = function() {showprovenance(http)};
	http.open("GET", app_vars.provenance, true);
	http.send(null);
	document.getElementById('provenancegif').style.visibility="visible";
}

//SELECT label FROM label_index, backlink_info WHERE backlink_info.urid = label_index.id AND backlink_info.id = 17114
function getdbinfo(http, id, ranked, checked) {
	var params = "?id=" + id + "&ranked=" + ranked + "&checked=" + checked;
	http.onreadystatechange = function() {showresults(http)};
	http.open("GET", app_vars.thispageurl + params, true);
	http.send(null);
	document.getElementById('registrygif1').style.visibility="visible";
	document.getElementById('registrygif2').style.visibility="visible";
}

function showprovenance(http) {
	if(http.readyState==4 && http.status==200)	{
		document.getElementById('provenancegif').style.visibility="hidden";
		jsoninfo  = eval("(" + http.responseText + ")");
		document.getElementById('uris0').innerHTML = jsoninfo.totaluris;
		//document.getElementById('provenancenodes').innerHTML = jsoninfo.provenance;
		nodesarray = jsoninfo.nodes;
		nodesindexarray = jsoninfo.nodesindex;
		howmanyurisarray = jsoninfo.howmanyuris;
		for ( var i=0; i<nodesarray.length; i++ ){
			nodes++;
			provcode = "provenancenode" + nodes;
			curr_node = document.getElementById('provenancenode0');
			new_node = curr_node.cloneNode(false);
			new_node.innerHTML = '<input type="radio" name="radionode" id="radionode' + nodes +'" checked="false" value="' + nodesindexarray[i] +'">' + nodesarray[i] +'</input><span id="uris' + nodes +'" style="float:right">' + howmanyurisarray[i] + '</span>'
			new_node.setAttribute('id', provcode);
			document.getElementById('placeholder3').appendChild(new_node);
		}
		document.getElementById('radionode0').checked = true; 			
	}
}

function showresults(http) {
	if(http.readyState==4 && http.status==200)	{
		document.getElementById('registrygif1').style.visibility="hidden";
		document.getElementById('registrygif2').style.visibility="hidden";
		jsoninfo  = eval("(" + http.responseText + ")");
		document.getElementById('label').innerHTML = jsoninfo.label;
		if (jsoninfo.uri!='undefined') document.getElementById('uri').innerHTML = '<a href="' + jsoninfo.uri + '" target="_blank">' + jsoninfo.uri + '</a>'; else document.getElementById('uri').innerHTML = jsoninfo.uri;
		document.getElementById('provenance').innerHTML = jsoninfo.node;
		if (!jsoninfo.backlinksum) {
			document.getElementById('backlinksum').innerHTML = 0;
		}
		else {
			document.getElementById('backlinksum').innerHTML = jsoninfo.backlinksum;
			p = jsoninfo.backlinks;
			for (var key in p) {
				if (p.hasOwnProperty(key)) {
					counter++;
					coderemote = "cola" + counter;
					codecount = "colb" + counter;
					curr_noderemote = document.getElementById('cola0');
					new_noderemote = curr_noderemote.cloneNode(false);
					new_noderemote.innerHTML = key;
					new_noderemote.setAttribute('id', coderemote);
					if (counter%2!=0) new_noderemote.setAttribute('style', '');
					curr_nodecount = document.getElementById('colb0');; //kind: 0=label, 1=uri, 2=provenance 3=backlinks
					new_nodecount = curr_nodecount.cloneNode(false);
					new_nodecount.setAttribute('id', codecount);
					new_nodecount.innerHTML = p[key]; 
					if (counter%2!=0) new_nodecount.setAttribute('style', '');
					document.getElementById('placeholder2').appendChild(new_noderemote);
					document.getElementById('placeholder2').appendChild(new_nodecount);
					//alert(key + " -> " + p[key]);
				}
			}
		}
		
	}
}

function removediv() {	
	while (0<counter) {
		elementa = document.getElementById('cola' + counter);
		elementb = document.getElementById('colb' + counter);
		document.getElementById('placeholder2').removeChild(elementa);
		document.getElementById('placeholder2').removeChild(elementb);
		counter--;	
	}
}

function xhr () {
// create xmlhttprequest object:
var http = null;
if(typeof XMLHttpRequest != 'undefined')
{
	try
	{
		http = new XMLHttpRequest();
	}
	catch (e) { http = null; }
}
else
{
	try
	{
		http = new ActiveXObject("Msxml2.XMLHTTP") ;
	}
	catch (e)
	{
		try
		{
			http = new ActiveXObject("Microsoft.XMLHTTP") ;
		}
		catch (e) {	http = null; }
	}
}
if(http) return http; else return null;
}