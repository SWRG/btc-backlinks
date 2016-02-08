# -*- coding: utf-8 -*-
# this should be loaded only as a module

# module that provides generic autosuggest api servicing
# connects to kb accessors for the real data

from twisted.internet import defer
import provenance_accessor
import ioparseformat

class NativeService:
	""" class providing functions for native autosuggest servicing """
	
	def __init__(self,request):
		self.request = request
	
	
	def service_handle_request(self):
		# get the accessor object for this service
		ac = provenance_accessor.ProvenanceAccessor()
		# call autosuggest method of accessor - this returns a tuple: a defered and a string!
		defer = ac.get_provenanceInfo()
		# add callback to do the output when finishing
		defer.addCallback(self.output_callback)
		
		# NOTE: nothing returned here - our caller (http server) does not expect anything now
		
	def output_callback(self,result):
		""" sends autosuggest response, result may be empty list. autochange is true if results come from alphabetical despite the different radiobutton"""
		# init an instance of output formatter to send output
		of = ioparseformat.OutputFormatter()
		# send output
		of.deliverJsonData(self.request,result)
		
