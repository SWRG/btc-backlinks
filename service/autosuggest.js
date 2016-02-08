function init() {
// try to guess the service url
var rexp = /(.*)\/ranked\//;	// for this to work, the redirector addr must NOT contain "/entry/"
var rexr = rexp.exec(location.href);
if (rexr.length>0) {
    //app_vars.classinfourl = rexr[1]+'/entry/classentry.html';
    //var suggesturl = rexr[1]+'/uservice/autosuggest2?maxitems=500&term=';
    var suggesturl  = "http://thalassa.ionio.gr/nsdbpedia?maxitems=20&term=";
}
new actb('tb');
var obj = new actb('tb', '', suggesturl);
document.getElementById('tb').focus();
}
/* Auto-suggest/auto-complete control
 *
 * original code:
 * (C) 2004-2005 zichun
 *
 * fixes and heavy modifications:
 * (C) 2007 Dmitriy Khudorozhkov (kh_dmitry2001@mail.ru) and contributors.
 *
 * This software is provided "as-is", without any express or implied warranty.
 * In no event will the author be held liable for any damages arising from the
 * use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 * 2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 *
 * 3. This notice may not be removed or altered from any source distribution.
 */ 
//jpap
var flagselect = true;  //an exoume patisei enter enw exoume epile3ei kati apo ti lista twn suggestions
var checked = 0; //to id tou node pou tha perasoume stin loadcontent
//jpap
var suggesturl = ""; // Global link to the server-side script, that gives you the suggestion list.
                     // Used for controls that do not define their own server script urls.
/* pre-load images:
var image = new Array(4);

image[0] = new Image(), image[1] = new Image(),
image[2] = new Image(), image[3] = new Image();

image[0].src = "arrow-down.gif", image[1].src = "arrow-down-d.gif";
image[2].src = "arrow-up.gif",   image[3].src = "arrow-up-d.gif"; 
*/
function actb(id, ca, url)
{
	// Public Variables:
	this.actb_suggesturl  = url || suggesturl;   // link to the server-side script, that gives you the suggestion list
	this.actb_timeOut     = -1;                  // autocomplete Timeout in ms (-1: autocomplete never time out)
	this.actb_response    = 000;                 // time, in milliseconds, between the last char typed and the actual query
	this.actb_lim         = -1;                   // number of elements autocomplete can show (-1: no limit)

	this.actb_firstText   = false;                // should the auto complete be limited to the beginning of keyword?
	this.actb_firstMatch  = false;                // if previous is false, should the exact matches be displayed first?
	this.actb_fullRefresh = true;               // should the script re-send the AJAX request after each entered character?

	this.actb_useIFrame   = true;                // should the control use an IFrame element to fix suggestion list positioning (MS IE only)?
	this.actb_useScroll   = true;                // should the control use a scroll bar (true) or a up/down buttons (false)?
	this.actb_mouse       = true;                // enable mouse support
	this.actb_noDefault   = true;                // should the control omit selecting the 1st item in a suggestion list?
//	this.actb_delimiter   = new Array(';', ','); // delimiter for multiple autocomplete. Set it to empty array for single autocomplete
	this.actb_delimiter   = new Array('_');
	this.actb_startcheck  = 2;                   // show widget only after this number of characters is typed in.

	this.actb_selectedIndex = -1;                // index (zero-based) of the element last chosen

	// Styles:
	this.actb_arColor   = '#656291';  // background color for the "arrows"
	this.actb_bgColor   = '#FFFFFF';
	this.actb_textColor = '#000000';
	this.actb_hColor    = '#D6D7E7';
	this.actb_fFamily   = 'verdana,arial,helvetica';
	this.actb_arrowSize = "7px";
	this.actb_fSize     = '10px';
	this.actb_hStyle    = 'font-family:verdana,arial,helvetica;';

	// "Private" Variables:
	this.actb_delimwords = [];
	this.actb_cdelimword = 0;
	this.actb_delimchar  = [];
	this.actb_display    = false;

	this.actb_pos    = 0;
	this.actb_total  = 0;
	this.actb_rangeu = 0;
	this.actb_ranged = 0;
	this.actb_bool   = [];
	this.actb_pre    = 0;
	this.actb_toid   = 0;
	this.actb_tomake = false;

	this.cur_x = 0;
	this.cur_y = 0;
	this.cur_w = 0;
	this.cur_h = 0;

	this.actb_mouse_on_list = 1;
	this.actb_caretmove     = false;

	this.actb_base_id  = id;
	this.actb_curr     = document.getElementById(id);
	this.actb_prevterm = this.actb_curr.value;

	this.actb_keywords = [];
	this.actb_values   = [];

	ca = ca || [];
	for(var i = 0, cl = ca.length; i < cl; i++)
	{
		if(String(typeof(ca[i])).toLowerCase() == "string")
		{
			this.actb_keywords[i] = ca[i];
			this.actb_values[i]   = "";
		}
		else
		{
			this.actb_keywords[i] = ca[i][0];
			this.actb_values[i]   = ca[i][1];
		}
	}

	return this.construct();
};

actb.prototype = {

	callLater: function(func, obj)
	{ return function() { func.call(obj) }; },

	construct: function()
	{
		this.actb_curr.actb = this;

		// pre-create event functions
		this.funcClick = this.actb_mouseclick;
		this.funcCheck = this.actb_checkkey;

		this.funcHighlight = this.actb_table_highlight;
		
		this.funcClear = this.callLater(this.actb_clear,    this);
		this.funcPress = this.callLater(this.actb_keypress, this);

		this.funcUp   = this.callLater(this.actb_goup,   this);
		this.funcDown = this.callLater(this.actb_godown, this);

		this.funcFocus   = this.callLater(this.actb_table_focus,   this);
		this.funcUnfocus = this.callLater(this.actb_table_unfocus, this);

		addEvent(this.actb_curr, "focus", this.callLater(this.actb_setup, this));

		return this;
	},

	actb_setup: function()
	{
		addEvent(document,       "keydown",  this.funcCheck);
		addEvent(this.actb_curr, "blur",     this.funcClear);
		addEvent(document,       "keypress", this.funcPress);
	},

	actb_clear: function()
	{
		var msie  = (document.all && !window.opera) ? true : false;
		var event = window.event;

		var doblur = true;
		if(msie && event && this.cur_h)
		{
			var x = event.x, y = event.y;

			if(((x > this.cur_x) && (x < (this.cur_x + this.cur_w))) && ((y > this.cur_y) && (y < (this.cur_y + this.cur_h))))
			{
				this.actb_curr.focus();
				doblur = false;
			}
		}

		if(doblur)
		{
			removeEvent(document,       "keydown",  this.funcCheck);
			removeEvent(this.actb_curr, "blur",     this.funcClear);
			removeEvent(document,       "keypress", this.funcPress);

			this.actb_removedisp();
		}
	},

	actb_parse: function(n)
	{
	    var t, plen;
		if(this.actb_delimiter.length > 0)
		{
			   t = this.actb_delimwords[this.actb_cdelimword].trim().addslashes();
			plen = this.actb_delimwords[this.actb_cdelimword].trim().length;
		}
		else
		{
			   t = this.actb_curr.value.addslashes();
			plen = this.actb_curr.value.length;
		}

		var tobuild = '';

		var re = this.actb_firstText ? new RegExp("^" + t, "i") : new RegExp(t, "i");
		var p = n.search(re);

		tobuild = n.substr(0, p);

		tobuild += "<u><font style='" + (this.actb_hStyle) + "'>";

		tobuild += n.substring(p, plen + p);

		tobuild += "</font></u>";

		tobuild += n.substring(plen + p, n.length);

		return tobuild;
	},

	actb_generate: function()
	{
		if(document.getElementById('tat_table_' + this.actb_base_id))
		{
		  this.actb_display = false;
		  document.body.removeChild(document.getElementById('tat_table_' + this.actb_base_id));
		}

		if(this.actb_total == 0)
		{
			this.actb_display = false;
			return;
		}

		var msie = (document.all && !window.opera) ? true : false;

		var bb = document.createElement('div');
		bb.id  = 'tat_table_' + this.actb_base_id;
		bb.style.position = 'absolute';
		bb.style.border = '#000000 solid 1px';
		this.cur_y = bb.style.top = eval(curTop(this.actb_curr) + this.actb_curr.offsetHeight) + "px";
		this.cur_x = bb.style.left = curLeft(this.actb_curr) + "px";
		this.cur_w = bb.style.width = this.actb_curr.offsetWidth + "px";

		var cc = null;
		if(msie && this.actb_useIFrame)
		{
			var cc = document.createElement('iframe');

			cc.src = "";
			cc.scrolling = "no";
			cc.frameBorder = "0";

			cc.style.position = "absolute";

			cc.style.zIndex = -1;
			cc.style.filter = "progid:DXImageTransform.Microsoft.Alpha(opacity=0);";
		}

		var a = document.createElement('table');
		a.cellSpacing ='1px';
		a.cellPadding ='2px';
		a.style.width  = "100%";
		a.style.backgroundColor = this.actb_bgColor;
		a.id = 'tat_table2_' + this.actb_base_id;

		if(this.actb_useScroll && (this.actb_total > this.actb_lim))
		{
			this.cur_h = bb.style.height = (this.actb_lim * parseInt(this.actb_fSize) + 3) + 2 + "px";

			bb.style.overflow  = "auto";
			bb.style.overflowX = "hidden";
		}

		this.cur_y = parseInt(this.cur_y);
		this.cur_h = parseInt(this.cur_h);
		this.cur_x = parseInt(this.cur_x);
		this.cur_w = parseInt(this.cur_w);

		document.body.appendChild(bb);
		if(cc)
		{
			cc.style.top  = a.offsetTop;
			cc.style.left = a.offsetLeft;

			bb.appendChild(cc);
		}
		bb.appendChild(a);

		var first = true, j = 1;

		if(this.actb_mouse)
		{
			a.onmouseout = this.funcUnfocus;
			a.onmouseover = this.funcFocus;
		}

		var counter = 0;
		for(var i = 0; i < this.actb_keywords.length; i++)
		{
			if(!this.actb_useScroll && ((this.actb_keywords.length > this.actb_lim) && (this.actb_total > this.actb_lim) && !i))
			{
				var r = a.insertRow(-1);
				r.style.backgroundColor = this.actb_arColor;

				var c = r.insertCell(-1);
				c.style.color = this.actb_textColor;
				c.style.fontFamily = 'arial narrow';
				c.style.fontSize = this.actb_arrowSize;
				c.style.cursor = 'default';
				c.align = 'center';

				replaceHTML(c, image[3]);
				addEvent(c, "click", this.funcUp);
			}

			if(this.actb_bool[i] && (this.actb_useScroll || (counter < this.actb_lim)))
			{
				counter++;
				var r = a.insertRow(-1);
				if(first && !this.actb_noDefault && !this.actb_tomake)
				{
				/*jpap - ola ta sxolisamena einai dika mou*/
					//r.style.backgroundColor = this.actb_hColor;
					//first = false;  
					this.actb_pos = counter;
				}
				else if(this.actb_pre == i)
				{
					//r.style.backgroundColor = this.actb_hColor;
					//first = false;
					this.actb_pos = counter;
				}
				else
				{
					//r.style.backgroundColor = this.actb_bgColor;
				}
				/*jpap*/
				r.id = 'tat_tr_' + this.actb_base_id + j;

				var c = r.insertCell(-1);
				c.style.color = this.actb_textColor;
				c.style.fontFamily = this.actb_fFamily;
				c.style.fontSize = this.actb_fSize;
				c.innerHTML = this.actb_parse(this.actb_keywords[i]);
				c.id = 'tat_td_' + this.actb_base_id + j;
				c.actb = this; 
				c.setAttribute('pos', j);

				if(this.actb_mouse)
				{
					c.style.cursor = 'pointer';
					addEvent(c, "click", this.funcClick);
					c.onmouseover = this.funcHighlight;
				}

				j++;
			}
		}

		if(!this.actb_useScroll && (this.actb_total > this.actb_lim))
		{
			var r = a.insertRow(-1);
			r.style.backgroundColor = this.actb_arColor;

			var c = r.insertCell(-1);
			c.style.color = this.actb_textColor;
			c.style.fontFamily = 'arial narrow';
			c.style.fontSize = this.actb_arrowSize;
			c.style.cursor = "pointer";
			c.align = 'center';
			replaceHTML(c, image[0]);

			addEvent(c, "click", this.funcDown);
		}

		this.actb_pos    = 0;
		this.actb_rangeu = 1;
		this.actb_ranged = j - 1;
		this.actb_display = true;
	},

	actb_remake: function()
	{
		var a = document.getElementById('tat_table2_' + this.actb_base_id);

		if(this.actb_mouse)
		{
			a.onmouseout  = this.funcUnfocus;
			a.onmouseover = this.funcFocus;
		}

		var i, k = 0;
		var first = true;
		var j = 1;

		if(this.actb_total > this.actb_lim)
		{
		    var b = (this.actb_rangeu > 1);

			var r = a.rows[k++];
			r.style.backgroundColor = this.actb_arColor;

			var c = r.firstChild;
			c.style.color = this.actb_textColor;
			c.style.fontFamily = 'arial narrow';
			c.style.fontSize = this.actb_arrowSize;
			c.style.cursor = 'default';
			c.align = 'center';

			replaceHTML(c, b ? image[2] : image[3]);

			if(b)
			{
				addEvent(c, "click", this.funcUp);
				c.style.cursor = 'pointer';
			}
			else
			{
				c.style.cursor = 'default';
			}
		}

		for(var i = 0; i < this.actb_keywords.length; i++)
		{
			if(this.actb_bool[i])
			{
				if(j >= this.actb_rangeu && j <= this.actb_ranged)
				{
					var r = a.rows[k++];
					r.style.backgroundColor = this.actb_bgColor;
					r.id = 'tat_tr_' + this.actb_base_id + j;

					var c = r.firstChild;
					c.style.color = this.actb_textColor;
					c.style.fontFamily = this.actb_fFamily;
					c.style.fontSize = this.actb_fSize;
					c.innerHTML = this.actb_parse(this.actb_keywords[i]);
					c.id = 'tat_td_' + this.actb_base_id + j;
					c.setAttribute('pos', j);
					j++;
				}
				else
				{
					j++;
				}
			}

			if(j > this.actb_ranged) break;
		}

		if(this.actb_keywords.length > this.actb_lim)
		{
			var b = ((j - 1) < this.actb_total);

			var r = a.rows[k];
			r.style.backgroundColor = this.actb_arColor;

			var c = r.firstChild;
			c.style.color = this.actb_textColor;
			c.style.fontFamily = 'arial narrow';
			c.style.fontSize = this.actb_arrowSize;
			c.style.cursor = 'default';
			c.align = 'center';

			replaceHTML(c, b ? image[0] : image[1]);

			if(b)
			{
				addEvent(c, "click", this.funcDown);
				c.style.cursor = 'pointer';
			}
			else
			{
				c.style.cursor = 'default';
			}
		}
	},
 
	actb_goup: function()
	{
		this.actb_curr.focus(); 

		if(!this.actb_display) return;
		if(this.actb_pos <= 1) return;

		var t = document.getElementById('tat_tr_' + this.actb_base_id + this.actb_pos);
		if(t && t.style) t.style.backgroundColor = this.actb_bgColor;

		this.actb_pos--;
		t = document.getElementById('tat_tr_' + this.actb_base_id + this.actb_pos);

		if(this.actb_useScroll && t)
		{
			var base = document.getElementById('tat_table_' + this.actb_base_id);
			base.scrollTop = t.offsetTop;
		}
		else
		{
			if(this.actb_pos < this.actb_rangeu)
			{
				this.actb_rangeu--;
				this.actb_ranged--;
				this.actb_remake();
			}
		}

		if(t && t.style) t.style.backgroundColor = this.actb_hColor;

		if(this.actb_toid)
		{
			clearTimeout(this.actb_toid);
			this.actb_toid = 0;
		}

		if(this.actb_timeOut > 0)
		  this.actb_toid = setTimeout(function() { this.actb_mouse_on_list = 1; this.actb_removedisp(); }, this.actb_timeOut);

		this.actb_curr.focus(); 
	},

	actb_godown: function()
	{
		this.actb_curr.focus(); 

		if(!this.actb_display) return;
		if(this.actb_pos == this.actb_total) return;

		if(this.actb_pos >= 1)
		{
			var t = document.getElementById('tat_tr_' + this.actb_base_id + this.actb_pos);
			if(t && t.style) t.style.backgroundColor = this.actb_bgColor;
		}
		else
		{
			this.actb_pos = 0;
		}

		this.actb_pos++;
		t = document.getElementById('tat_tr_' + this.actb_base_id + this.actb_pos);

		if(this.actb_useScroll && t)
		{
			var base = document.getElementById('tat_table_' + this.actb_base_id);
			base.scrollTop = t.offsetTop;
		}
		else
		{
			if(this.actb_pos > this.actb_ranged)
			{
				this.actb_rangeu++;
				this.actb_ranged++;
				this.actb_remake();
			}
		}

		if(t && t.style) t.style.backgroundColor = this.actb_hColor;

		if(this.actb_toid)
		{
			clearTimeout(this.actb_toid);
			this.actb_toid = 0;
		}

		if(this.actb_timeOut > 0)
			this.actb_toid = setTimeout(function() { this.actb_mouse_on_list = 1; this.actb_removedisp(); }, this.actb_timeOut);

		this.actb_curr.focus();
	},

	actb_mouseclick: function(event)
	{
		var elem = getTargetElement(event);
//jpap -- pros8etw ena akoma parentNode
		if(!elem.id) elem = elem.parentNode.parentNode; //if(!elem.id) elem = elem.parentNode;
//jpap
		var obj = elem.actb; 
		if(!obj.actb_display) return;

		obj.actb_mouse_on_list = 0;
		obj.actb_pos = elem.getAttribute('pos');
		obj.actb_penter();
	},

	actb_table_focus: function()
	{ this.actb_mouse_on_list = 1; },

	actb_table_unfocus: function()
	{
		this.actb_mouse_on_list = 0;

		if(this.actb_toid)
		{
			clearTimeout(this.actb_toid);
			this.actb_toid = 0;
		}

		if(this.actb_timeOut > 0)
			this.actb_toid = setTimeout(function() { obj.actb_mouse_on_list = 0; this.actb_removedisp(); }, this.actb_timeOut);
	},

	actb_table_highlight: function(event)
	{
		var elem = getTargetElement(event);

		var obj = elem.actb;
		if(!obj) return;

		obj.actb_mouse_on_list = 1;

		var row = document.getElementById('tat_tr_' + obj.actb_base_id + obj.actb_pos);
		if(row && row.style) row.style.backgroundColor = obj.actb_bgColor;

		obj.actb_pos = elem.getAttribute('pos');

		row = document.getElementById('tat_tr_' + obj.actb_base_id + obj.actb_pos);
		if(row && row.style)
			row.style.backgroundColor = obj.actb_hColor;

		if(obj.actb_toid)
		{
			clearTimeout(obj.actb_toid);
			obj.actb_toid = 0;
		}

		if(obj.actb_timeOut > 0)
			obj.actb_toid = setTimeout(function() { obj.actb_mouse_on_list = 0; obj.actb_removedisp(); }, obj.actb_timeOut);
	},
 
 	actb_penter: function()
	{
		if(!this.actb_display) return;
//jpap: an isxyei to parakatw, simainei pws exoume patisei enter xwris na epile3oume kati (dedomenou oti mas exei ferei suggestions)
// --		if(this.actb_pos < 1) return;

		if(this.actb_pos == 0) {
		//jpap *******************************************************************************************************************************************************
			this.actb_pos = 1;
			flagselect = true; 
			//jpap
		}
		else flagselect = true;
//jpap
		this.actb_selectedIndex = this.actb_pos - 1;
		this.actb_display = false;

		var word = '', c = 0;
		for(var i = 0; i <= this.actb_keywords.length; i++)
		{
			if(this.actb_bool[i]) c++;
			if(c == this.actb_pos)
			{
				word = this.actb_keywords[i];
				break;
			}
		}

		this.actb_insertword(word, this.actb_values[i]);
	},

	actb_insertword: function(a,b)
	{
		if(this.actb_delimiter.length > 0)
		{
			var str = '';

			for(var i = 0; i < this.actb_delimwords.length; i++)
			{
				if(this.actb_cdelimword == i)
				{
					prespace = postspace = '';
					gotbreak = false;
					for(var j = 0; j < this.actb_delimwords[i].length; ++j)
					{
						if(this.actb_delimwords[i].charAt(j) != ' ')
						{
							gotbreak = true;
							break;
						}

						prespace += ' ';
					}

					for(j = this.actb_delimwords[i].length - 1; j >= 0; --j)
					{
						if(this.actb_delimwords[i].charAt(j) != ' ') break;
						postspace += ' ';
					}

					str += prespace;
					str += a;
					if(gotbreak) str += postspace;
				}
				else
				{
					str += this.actb_delimwords[i];
				}

				if(i != this.actb_delimwords.length - 1)
					str += this.actb_delimchar[i];
			}

//jpap : svinei to textbox an den yparxoun suggestions
//			this.actb_curr.value = str;
//jpap
			this.actb_curr.title = b;
			setCaret(this.actb_curr, this.actb_curr.value.length);
		}
		else
		{
			this.actb_curr.value = a;
		}
		
		this.actb_mouse_on_list = 0;
		this.actb_removedisp();
/*jpap*/if (document.getElementById("radio1").checked) ranked = true; else ranked = false;
/*jpap*/if (flagselect) loadContent(b, ranked, checked);  else exit;

	},

	actb_removedisp: function()
	{
		if(this.actb_mouse_on_list == 0)
		{
			this.actb_display = 0;

			var base = document.getElementById('tat_table_' + this.actb_base_id);
			if(base)
			  document.body.removeChild(base);

			if(this.actb_toid)
			{
			  clearTimeout(this.actb_toid);
			  this.actb_toid = 0;
			}

			this.cur_x = 0;
			this.cur_y = 0;
			this.cur_w = 0;
			this.cur_h = 0;
		}
	},

	actb_keypress: function(event)
	{
		if(this.actb_caretmove) stopEvent(event);
		return !this.actb_caretmove;
	},

	actb_checkkey: function(event)
	{
		event = event || window.event;

		var code = event.keyCode;
		var obj = getTargetElement(event).actb; 
		obj.actb_caretmove = 0;
		var term = "";

		if(obj.actb_toid)
		{
			clearTimeout(obj.actb_toid);
			obj.actb_toid = 0;
		}
		switch(code)
		{
			// Up arrow:
			case 38:
				obj.actb_goup();
				obj.actb_caretmove = 1;
				return false;
				break;

			// Down arrow:
			case 40:
				if(!obj.actb_display)
				{
					obj.actb_toid = setTimeout(function()
					{
						obj.actb_tocomplete.call(obj, -1);
					},
					25);
				}
				else
				{
					obj.actb_godown();
					obj.actb_caretmove = 1;
				}
				return false;
				break;

			// Esc:
			case 27:
				term = obj.actb_curr.value;

				obj.actb_mouse_on_list = 0;
				obj.actb_removedisp();
				break;

			// Enter:
			case 13:
				if(obj.actb_display)
				{
					obj.actb_caretmove = 1;
					obj.actb_penter();
					return false;
				}
				break;

			// Tab:
			case 9:
				if(obj.actb_display || obj.actb_toid)
				{
					obj.actb_caretmove = 1;
					obj.actb_penter();

					setTimeout(function() { obj.actb_curr.focus(); }, 25);
					return false;
				}
				break;

			default:
				obj.actb_caretmove = 0;
				obj.actb_toid = setTimeout(function()
				{
					obj.actb_tocomplete.call(obj, code);
				},
				(obj.actb_response < 10 ? 10 : obj.actb_response));
				break;
		}

		if(term.length) setTimeout(function() { obj.actb_curr.value = term; }, 25);
		return true;
	},

	actb_tocomplete: function(kc)
	{
		if(this.actb_toid)
		{
			clearTimeout(this.actb_toid);
			this.actb_toid = 0;
		}
		else
		{
			return;
		}

		if(this.actb_display && (this.actb_prevterm == this.actb_curr.value)) return;
		this.actb_prevterm = this.actb_curr.value;

		if(kc == 38 || kc == 40 || kc == 13) return;

		if(this.actb_display)
		{ 
			var word = 0;
			var c = 0;
			//jpap molis emfanistei to div me ta suggestions
			//this.funcHighlight;
			//jpap

			for(var i = 0; i <= this.actb_keywords.length; i++)
			{
				if(this.actb_bool[i]) c++;

				if(c == this.actb_pos)
				{
					word = i;
					break;
				}
			}
			
			this.actb_pre = word;
		}
		else
		{
			this.actb_pre = -1;
		}
		
		if(this.actb_curr.value == '')
		{
			this.actb_mouse_on_list = 0;
			this.actb_removedisp();
		}

		var ot, t;

		if(this.actb_delimiter.length > 0)
		{
			var caret_pos_end = this.actb_curr.value.length;

			var delim_split = '';
			for(var i = 0; i < this.actb_delimiter.length; i++)
				delim_split += this.actb_delimiter[i];

		    delim_split = delim_split.addslashes();
			var delim_split_rx = new RegExp("([" + delim_split + "])");
			c = 0;
			this.actb_delimwords = [];
			this.actb_delimwords[0] = '';

			for(var i = 0, j = this.actb_curr.value.length; i < this.actb_curr.value.length; i++, j--)
			{
				if(this.actb_curr.value.substr(i, j).search(delim_split_rx) == 0)
				{
					ma = this.actb_curr.value.substr(i,j).match(delim_split_rx);
					this.actb_delimchar[c] = ma[1];
					c++;
					this.actb_delimwords[c] = '';
				}
				else
				{
					this.actb_delimwords[c] += this.actb_curr.value.charAt(i);
				}
			}

			var l = 0;
			this.actb_cdelimword = -1;
			for(i = 0; i < this.actb_delimwords.length; i++)
			{
				if((caret_pos_end >= l) && (caret_pos_end <= l + this.actb_delimwords[i].length))
					this.actb_cdelimword = i;

				l += this.actb_delimwords[i].length + 1;
			}

			ot = this.actb_delimwords[this.actb_cdelimword].trim(); 
			 t = this.actb_delimwords[this.actb_cdelimword].addslashes().trim();
		}
		else
		{
			ot = this.actb_curr.value;
			 t = this.actb_curr.value.addslashes();
		}

		if(ot.length == 0)
		{
			this.actb_mouse_on_list = 0;
			this.actb_removedisp();
		}
		else if((ot.length == 1) || this.actb_fullRefresh ||
		       ((ot.length > 1) && !this.actb_keywords.length) ||
		       ((ot.length > 1) && (this.actb_keywords[0].substr(0, 1).toLowerCase() != ot.substr(0, 1).toLowerCase())))
		{
			var ot_ = ((ot.length > 1) && !this.actb_fullRefresh) ? ot.substr(0, 1) : ot;

			if(this.actb_suggesturl.length)
			{
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

				if(http)
				{
					// For local debugging in Mozilla/Firefox only!
					/*try
					{
						netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
					} catch (e) { }*/

					if(http.overrideMimeType)
					http.overrideMimeType('text/xml');
/*jpap*/			if (document.getElementById("radio1").checked) {
/*jpap*/				ot_ += '&ranked=true'; 
/*jpap*/			}
/*jpap*/				else {
/*jpap*/				ot_ += '&ranked=false';
/*jpap*/			}
					for (var i=0; i<document.getElementsByName('radionode').length; i++) {
						if (document.getElementsByName('radionode')[i].checked==true)  {
							ot_ += '&checked=' + document.getElementsByName('radionode')[i].value;
							checked = document.getElementsByName('radionode')[i].value;
						}
					}
					http.open("GET", this.actb_suggesturl + ot_, true);

					var obj = this;
					http.onreadystatechange = function(n)
					{
						if(http.readyState == 4)
						{
							if((http.status == 200) || (http.status == 0))
							{
								var xmlDocument = null, tmpinfo = null;
								document.getElementById('autosuggestgif').style.visibility="hidden";
								try
								{
									xmlDocument = http.responseXML;
									tmpinfo = xmlDocument.getElementsByTagName('listdata').item(0).firstChild.data;
								}
								catch(e)
								{
									try
									{
										xmlDocument = (new DOMParser()).parseFromString(http.responseText, "text/xml");
										tmpinfo = xmlDocument.getElementsByTagName('listdata').item(0).firstChild.data;
									}
									catch(ee) {}
								}
/*jpap*/						if (!tmpinfo) {
/*jpap*/							if (document.getElementById('tat_table_tb')) {
/*jpap*/								document.getElementById('tat_table_tb').style.display='none';
/*jpap*/								return;
/*jpap*/							}
/*jpap*/							return;
/*jpap*/						}
								obj.actb_keywords = tmpinfo.split('|');

								var keyword_number = obj.actb_keywords.length;
								
								for(var i = 0; i < keyword_number; i++)
								{
									//var ca = obj.actb_keywords[i], comma = ca.indexOf(",");
									var ca = obj.actb_keywords[i], delimiter = ca.indexOf(obj.actb_delimiter[0]);

									if(delimiter != -1)
									{
										//var ci = ca.split(',');
										var ci = ca.split(obj.actb_delimiter[0]);

										obj.actb_keywords[i] = ci[0];
										obj.actb_values[i]   = ci[1];
									}
									else
									{
										obj.actb_values[i] = "";										
									}
								}

								obj.done.call(obj, ot_, t);
							}
						}
					}

					http.send(null);
					document.getElementById("autosuggestgif").style.visibility="visible";
				}

				// xmlhttp object creation failed
				return;
			}
			else
			{
				this.done(ot, t);
			}
		}
		else
		{
			this.done(ot, t);
		}
	},

	done: function(ot, t)
	{
		if(ot.length < this.actb_startcheck) return;

		var re = new RegExp(((!this.actb_firstText && !this.actb_firstMatch) ? "" : "^") + t, "i");

		this.actb_total = 0;
		this.actb_tomake = false;

		var al = this.actb_keywords.length;

		for(var i = 0; i < al; i++)
		{
			this.actb_bool[i] = false;
			if(re.test(this.actb_keywords[i]))
			{
				this.actb_total++;
				this.actb_bool[i] = true;

				if(this.actb_pre == i) this.actb_tomake = true;
			}
		}

		if(!this.actb_firstText && this.actb_firstMatch)
		{
			var tmp = [], tmpv = [];

			for(i = 0; i < al; i++)
			{
				if(this.actb_bool[i])
				{
					tmp[tmp.length]   = this.actb_keywords[i];
					tmpv[tmpv.length] = this.actb_values[i];
				}
			}

			re = new RegExp(t, "i");

			for(i = 0; i < al; i++)
			{
				if(re.test(this.actb_keywords[i]) && !this.actb_bool[i])
				{
					this.actb_total++;
					this.actb_bool[i] = true;

					if(this.actb_pre == i) this.actb_tomake = true;

					tmp[tmp.length]   = this.actb_keywords[i];
					tmpv[tmpv.length] = this.actb_values[i];
				}
			}

			for(i = 0; i < al; i++)
			{
				if(!this.actb_bool[i])
				{
					tmp[tmp.length]   = this.actb_keywords[i];
					tmpv[tmpv.length] = this.actb_values[i];
				}
			}

			for(i = 0; i < al; i++)
			{
				this.actb_keywords[i] = tmp[i];
				this.actb_values[i]   = tmpv[i];
			}

			for(i = 0; i < al; i++)
				this.actb_bool[i] = (i < this.actb_total) ? true : false;
		}

		if(this.actb_timeOut > 0)
		  this.actb_toid = setTimeout(function(){ this.actb_mouse_on_list = 0; this.actb_removedisp(); }, this.actb_timeOut);
		this.actb_generate();
	}
}

// Supplementary functions

// Add an event to the obj given
// event_name refers to the event trigger, without the "on", like click or mouseover
// func_name refers to the function callback when event is triggered
function addEvent(obj, event_name, func_ref)
{
	if(obj.addEventListener && !window.opera)
	{
		obj.addEventListener(event_name, func_ref, true);
	}
	else
	{
		obj["on" + event_name] = func_ref;
	}
}

// Removes an event from the object
function removeEvent(obj, event_name, func_ref)
{
	if(obj.removeEventListener && !window.opera)
	{
		obj.removeEventListener(event_name, func_ref, true);
	}
	else
	{
		obj["on" + event_name] = null;
	}
}

// Stop an event from bubbling up the event DOM
function stopEvent(event)
{
	event = event || window.event;

	if(event)
	{
		if(event.stopPropagation) event.stopPropagation();
		if(event.preventDefault) event.preventDefault();

		if(typeof event.cancelBubble != "undefined")
		{
			event.cancelBubble = true;
			event.returnValue = false;
		}
	}

	return false;
}

// Get the obj that triggers off the event
function getTargetElement(event)
{
	event = event || window.event;
	return event.srcElement || event.target;
}
   
// Sets the caret position to l in the object
function setCaret(obj, l)
{
	obj.focus();

	if(obj.setSelectionRange)
	{
		obj.setSelectionRange(l, l);
	}
	else if(obj.createTextRange)
	{
		m = obj.createTextRange();		
		m.moveStart('character', l);
		m.collapse();
		m.select();
	}
}

// String functions
String.prototype.addslashes = function() { return this.replace(/(["\\\.\|\[\]\^\*\+\?\$\(\)])/g, '\\$1'); }

String.prototype.trim = function () { return this.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1"); };

// Offset position from top of the screen
function curTop(obj)
{
	var toreturn = 0;
	while(obj)
	{
		toreturn += obj.offsetTop - (window.opera ? 0 : obj.scrollTop);
		obj = obj.offsetParent;
	}

	return toreturn;
}

// Offset position from left of the screen
function curLeft(obj)
{
	var toreturn = 0;
	while(obj)
	{
		toreturn += obj.offsetLeft - (window.opera ? 0 : obj.scrollLeft);
		obj = obj.offsetParent;
	}

	return toreturn;
}

// Image installation
function replaceHTML(obj, oImg)
{
	var el = obj.childNodes[0];
	while(el)
	{
		obj.removeChild(el);
		el = obj.childNodes[0];
	}

	obj.appendChild(oImg);
}
