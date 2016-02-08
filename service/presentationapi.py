# -*- coding: utf-8 -*-
# this should be loaded only as a module

# module that provides generic autosuggest api servicing
# connects to kb accessors for the real data

from twisted.internet import defer

import ioparseformat
import dbpedia_accessor
import registry_accessor

class NativeService:
	""" class providing functions for native autosuggest servicing """
	
	def __init__(self,request):
		self.request = request
	
	
	def service_handle_request(self):
		""" entrypoint for GET requests to native autosuggest api """
		
		# init an instance of input parser to extract GET input data
		ip = ioparseformat.InputParser()
		
		# extract get info
		idict = ip.parseUnstructuredGetData(self.request)	# 
		urid = idict.get('id')
		ranked = idict.get('ranked')
		checked = idict.get('checked')
		# get the accessor object for this service
		ac = registry_accessor.RegistryAccessor()
		# call autosuggest method of accessor - this returns a tuple: a defered and a string!
		defer = ac.get_presentationInfo(urid=urid,ranked=ranked,checked=checked)
		# add callback to do the output when finishing
		defer.addCallback(self.output_callback)
		
		# NOTE: nothing returned here - our caller (http server) does not expect anything now
		
	def output_callback(self,result):
		""" sends autosuggest response, result may be empty list. autochange is true if results come from alphabetical despite the different radiobutton"""
		# init an instance of output formatter to send output
		of = ioparseformat.OutputFormatter()
		# send output
		of.deliverJsonData(self.request,result)
		
