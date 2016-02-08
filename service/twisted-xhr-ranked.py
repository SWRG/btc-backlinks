# -*- coding: utf-8 -*-
# this should be run with the twistd (e.g. "twistd -ny twisted-xhr-nh.py" or only -y to daemonize)
# this is a clone of original "twisted-xhr.py"


from twisted.application import internet,service
from twisted.web import server,resource
from twisted.web.static import File
from twisted.internet import reactor,defer

# modules of services provided
import autosuggestapi
import presentationapi
import provenanceapi

# (hardwired) definitions of resources
class Root(resource.Resource):	# the / resource class
	isLeaf = False

class NativeAutosuggest(resource.Resource):	# servicepoint resource for native autosuggest requests 
	isLeaf = True				# this is a 'named' service (kburi is explicit, not in request)
	
	def __init__(self):
		""" used only to store the global kbmanager instance """
		""" and the resource name of kb to used for autosuggest """
		resource.Resource.__init__(self)
	
	def render_GET(self,request):
		""" function called when servicing GET requests """
		""" for native autosuggest api. Returns immediatelly, real service """
		""" should be in a callback of autosuggestapi service module"""
		
		# create instance of service handler
		sh = autosuggestapi.NativeService(request)
		# call handler - this returns immediatelly!
		sh.service_handle_request()
		# signal 'not done' - real work will be in a callback
		return server.NOT_DONE_YET	# more of response to follow

class PresentSuggestion(resource.Resource):	# servicepoint resource for native autosuggest requests 
	isLeaf = True				# this is a 'named' service (kburi is explicit, not in request)
	
	def __init__(self):
		""" used only to store the global kbmanager instance """
		""" and the resource name of kb to used for autosuggest """
		resource.Resource.__init__(self)
	
	def render_GET(self,request):
		""" function called when servicing GET requests """
		""" for native autosuggest api. Returns immediatelly, real service """
		""" should be in a callback of autosuggestapi service module"""
		
		# create instance of service handler
		sh = presentationapi.NativeService(request)
		# call handler - this returns immediatelly!
		sh.service_handle_request()
		# signal 'not done' - real work will be in a callback
		return server.NOT_DONE_YET	# more of response to follow

class PresentProvenance(resource.Resource):	# servicepoint resource for native autosuggest requests 
	isLeaf = True				# this is a 'named' service (kburi is explicit, not in request)
	
	def __init__(self):
		""" used only to store the global kbmanager instance """
		""" and the resource name of kb to used for autosuggest """
		resource.Resource.__init__(self)
	
	def render_GET(self,request):
		""" function called when servicing GET requests """
		""" for native autosuggest api. Returns immediatelly, real service """
		""" should be in a callback of autosuggestapi service module"""
		
		# create instance of service handler
		sh = provenanceapi.NativeService(request)
		# call handler - this returns immediatelly!
		sh.service_handle_request()
		# signal 'not done' - real work will be in a callback
		return server.NOT_DONE_YET	# more of response to follow

class DummyLogger(resource.Resource):	# servicepoint resource for dummy logging - dump any GET request
					# you want to be logged here, discard returned value 
	isLeaf = True
		
	def render_GET(self,request):
		""" function called when servicing GET requests, returns a simple text plain reply """
		request.setHeader('Content-type','text/plain')
		return "ok"

# main app part, to start the http server
# global variable MUST be called exactly "application"!!!
application = service.Application('ranked')	

# build the resources tree
root = Root()
root.putChild("ranked",File("./"))	# to serve normal files (GET) under /ranked
root.putChild("nsdbpedia",NativeAutosuggest())	# to serve native autosuggest requests (GET) for registry
root.putChild("presentation",PresentSuggestion())
root.putChild("provenance",PresentProvenance())

# here we connect a "Site" (subclass of "twistewd.web.http.HTTPFactory") to a "resource"
site = server.Site(root)	
# start a (reactor based) web server listening
internet.TCPServer(8088,site).setServiceParent(service.IServiceCollection(application))	
