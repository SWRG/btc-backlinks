# -*- coding: utf-8 -*-
# this should be loaded only as a module

# module that provides various classes and methods to parse request input data
# and format response output data

import re

class InputParser:
	""" a class that provides various methods to parse and extract """
	""" GET/POST request input data """
	
	def __init__(self):
		# generic error flag
		self.generror = False
		#generic error msg
		self.generrmsg = ''
	
	def parseUnstructuredGetData(self,request): 
		""" a simple class to parse GET params as unstructured data """
		""" (that is, as a flat key-value pair dict) which is returned """

		# the dict to be returned
		retdict = {}
		# simply pass all request args (which are actually in a dict!) to the dict returned
		for k,v in request.args.iteritems():
			retdict[k] = v[0]	# twisted gives GET args in {key:[value],...} format!
		# return the new (flat!) dict
		return retdict

class OutputFormatter:
	""" a class that provides methods to output data in various formats """
	
	def xmlsafe(self,istr):
		""" utility function to sanitize xml strings by replacing & and < """
		return istr.replace("&","&amp;").replace("<","&lt;")

	def xmlquotesafe(self,istr):
		""" utility function to sanitize xml strings by replacing &, " and < """
		return istr.replace("&","&amp;").replace("<","&lt;").replace('"',"&quot;")


	def formatXMLAutosuggestNative(self,request,itemlist):
		""" outputs a list of items as an XML response """
		""" list contains tuples of (item-id,item-weight,item-label, item-node) """
		""" and output is of the form <listdata>item-label,item-id|item-label,item-id|..</listdata> """
		""" labels and ids must be already utf-8 encoded """
		sepr = ''
#		for itemid,itemweight,itemlabel,itemnode in itemlist:
		itemnodeprevious = ''
		counter = 0
		ip = InputParser()
		getdict = ip.parseUnstructuredGetData(request)
		maxitems = int(getdict.get('maxitems'))
		# prepare xml message
		outstr = '<?xml version="1.0" encoding="UTF-8"?><listdata>'
		for itemid,itemweight,itemlabel in itemlist:
			if (self.xmlsafe(itemlabel)!=itemnodeprevious):
				if (counter<maxitems):
					outstr += "%s%s_%s" % (sepr,self.xmlsafe(itemlabel),itemid)
					counter = counter + 1
					itemnodeprevious = self.xmlsafe(itemlabel)
			if sepr=='': sepr='|'	# for every iteration except 1st
		outstr += '</listdata>'
		#print len(itemlist)
		# send response
		request.setHeader('Content-type','application/xml')
		request.write(outstr.encode('utf-8'))
		request.finish()
	
	def deliverJsonData(self,request,jsonitem):
		"""delivers db results to helper.js for further manipulation and post to gui"""
		#if (len(itemlist)!=0): outstr = itemlist.pop(0)					
		request.setHeader('Content-type','application/json')
		request.write(jsonitem)
		request.finish()
