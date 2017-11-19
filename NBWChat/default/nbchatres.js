// JScript source code
var lang = new Array();

var bShowServAuthMsgs = false;
var bShowIdentOnJoin = false;

//menu items
lang['menuitem_ignore_true']='Remove Ignore';
lang['menuitem_ignore_false']='Ignore';
lang['menuitem_tagged_true']='Remove Tag';
lang['menuitem_tagged_false']='Tag';
//lang['']='';
//lang['']='';
//lang['']='';
//lang['']='';

//interface
var cmdIndChar = '›';
var txPretopiclabel = 'Topic is: ';

//smilies
var colRepl = new Array();
var sEmotsDir = 'images/emots/';
colRepl[':)'] = 'smile.gif';
colRepl[':d'] = 'grin.gif';
colRepl['*-)'] = 'mmm.gif';
colRepl[":("] = 'sad.gif';
colRepl[":*("] = 'cry2.gif';
colRepl[":'("] = 'cry.gif';
colRepl['(us)'] = 'dont-know.gif';
colRepl['(a)'] = 'angel.gif';
colRepl['^o)'] = 'ugh.gif';
colRepl[':|'] = 'not-amused.gif';
colRepl[':s'] = 'confused.gif';
colRepl[':o'] = 'shock.gif';
colRepl[':*'] = 'shock-shake.gif';
colRepl['::('] = 'snotty-sad.gif';
colRepl[':^)'] = 'garth.gif';
colRepl[':_)'] = 'smile-.gif';
colRepl[':p'] = 'tounge-wiggle.gif';
colRepl['~o'] = 'drool.gif';
colRepl[';)'] = 'wink.gif';
colRepl['(h)'] = 'kool.gif';
colRepl['8o|'] = 'grr.gif';
colRepl['ys)'] = 'yes.gif';
colRepl['|n)'] = 'no.gif';
colRepl['|^:'] = 'tart.gif';
colRepl['8-)'] = 'roll_eyes.gif';
colRepl['8-|'] = 'nerd.gif';
colRepl[':@'] = 'angry.gif';
colRepl['(6)'] = 'devil.gif';
colRepl['|-)'] = 'sleep.gif';
colRepl[':$'] = 'shy.gif';
colRepl[':-#'] = 'shhh.gif';
colRepl['(~)'] = 'shiner.gif';
colRepl['+o('] = 'sick.gif';
colRepl[':~'] = 'wave.gif';
colRepl[':g)'] = 'giggle.gif';
colRepl[':h)'] = 'hysterics.gif';
colRepl['(fl)'] = 'whistling.gif';
colRepl['(i)'] = 'idea.gif';
colRepl['(hf)'] = 'hearts.gif';
colRepl[':rb'] = 'rabbling.gif';
colRepl[':w:'] = 'wobble.gif';
colRepl['#sp'] = 'spin.gif';
colRepl['^^:'] = 'yay.gif';
colRepl['|~'] = 'dance.gif';
colRepl['(bs)'] = 'bull.gif';
colRepl['(mo)'] = 'cow.gif';
colRepl['(gh)'] = 'ghost.gif';
colRepl['(dk)'] = 'drunk.gif';
colRepl['(al)'] = 'alien.gif';
colRepl['(g)'] = 'present.gif';
colRepl[':br'] = 'brr.gif';
colRepl['(brb)'] = 'brb.gif';
colRepl['(as)'] = 'ass.gif';
colRepl['({)'] = 'male-hug.gif';
colRepl['(})'] = 'fem-hug.gif';
colRepl['(ks)'] = 'kisses.gif';
colRepl['(k)'] = 'lips.gif';
colRepl['(l)'] = 'heart_beat.gif';
colRepl['(u)'] = 'broken-heart.gif';
colRepl['(au)'] = 'car.gif';
colRepl['(@)'] = 'cat.gif';
colRepl['(&)'] = 'dog.gif';
colRepl['(tu)'] = 'turtle.gif';
colRepl['(brb)'] = 'brb.gif';
colRepl['(s)'] = 'moon.gif';
colRepl['(r*)'] = 'rainbow-stars.gif';
colRepl['(*)'] = 'stars.gif';
colRepl['~#'] = 'peeky.gif';
colRepl['|w'] = 'togetherness.gif';
colRepl['(x)'] = 'female.gif';
colRepl['(z)'] = 'male.gif';
colRepl['(ff)'] = 'rosey.gif';
colRepl['(tx)'] = 'texas.gif';
colRepl['(f)'] = 'flower.gif';
colRepl['(w)'] = 'wilting.gif';
colRepl['(d)'] = 'cocktail-x2.gif';
colRepl['(b)'] = 'beer.gif';
colRepl['(c)'] = 'cuppa.gif';
colRepl['(pi)'] = 'pizza.gif';
colRepl['(%)'] = 'handcuffs.gif';
colRepl['(mp)'] = 'mobile.gif';
colRepl['(so)'] = 'football.gif';
colRepl['(8)'] = 'music-note.gif';
colRepl['(e)'] = 'email.gif';
colRepl['(p)'] = 'camera.gif';
colRepl['(ci)'] = 'ciggy.gif';
colRepl['(m)'] = 'messenger.gif';
colRepl['(?)'] = 'asl.gif';
colRepl['(pl)'] = 'dinner.gif';
colRepl['(yn)'] = 'fingers-crossed.gif';
colRepl['(y)'] = 'thumb_up.gif';
colRepl['(n)'] = 'thumb_down.gif';
colRepl['(o)'] = 'clock.gif';
colRepl['(st)'] = 'lightning2.gif';
colRepl['(rn)'] = 'rain.gif';
colRepl['(**)'] = 'snow2.gif';
colRepl['(um)'] = 'umbrella.gif';
colRepl['(#)'] = 'sun2.gif';
colRepl['(ip)'] = 'palm-tree.gif';
colRepl['(t)'] = 'telephone.gif';
colRepl[':['] = 'bat2.gif';
colRepl['(ap)'] = 'plane.gif';
colRepl['-sc'] = 'scrub.gif';
colRepl['(ed)'] = 'egg_dance.gif';
	  //CHRISTMAS//
// colRepl['(ix)'] = 'xmas.gif';
// colRepl['(sm)'] = 'snowman.gif';
// colRepl['|x'] = 'xmas-tree.gif';
// colRepl['(nw)'] = 'new-year.gif';
// colRepl['(rf)'] = 'rudey.gif';
// colRepl[':x'] = 'santa.gif';
// colRepl['|o'] = 'baubles.gif';
// colRepl['^x'] = 'snowflake.gif';
// colRepl['(el)'] = 'elf.gif';
// colRepl['(xp)'] = 'xmas-pud.gif';
	 //END CHRISTMAS
colRepl['(r)'] = 'rainbow2.gif';
colRepl['(bu)'] = 'butterfly.gif';
//colRepl['(^^)'] = 'ballons2.gif';
colRepl['(^)'] = 'cake.gif';
colRepl['-@)'] = 'hammering.gif';
//colRepl[':y'] = 'yahoo.gif';
	 //HALLOWEEN//
// colRepl['(bh)'] = 'bat-halloween.gif';
// colRepl['(pk)'] = 'pumpkin.gif';
// colRepl['(fn)'] = 'frank.gif';
// colRepl['(wt)'] = 'witch.gif';
// colRepl['(fg)'] = 'fangs.gif';
// colRepl['(su)'] = 'skull.gif';
// colRepl['(mu)'] = 'mummy.gif';
	//END HALLOWEEN//
//THANKSGIVING//
colRepl['(fp)'] = 'fem-pilg.gif';
colRepl['(mg)'] = 'male-pilg.gif';
colRepl['(tk)'] = 'turkey.gif';
//END THANKSGIVING//
//valentine//
// colRepl['(v1)'] = 'val1.gif';
// colRepl['(v2)'] = 'val2.gif';
// colRepl['(v3)'] = 'val3.gif';
//END valintine//
	   //EASTER//
//colRepl['(eg)'] = 'easter-egg.gif';//
//colRepl['(b^)'] = 'bunny3.gif';
//colRepl['|>'] = 'chick-egg.gif';//
	 //END EASTER//

