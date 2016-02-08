# -*- coding: utf-8 -*-
# should run only as module

# this module provides accessor methods for dbpedia KB

from twisted.internet import defer
import MySQLdb
import re
import simplejson as json
import conf
import ast
import collections
from collections import defaultdict

class RegistryAccessor:
	
	def __init__(self):
		# TBD
		pass
	
	def get_presentationInfo(self,urid,ranked,checked):
		""" queries Mysql and returns various db data """
		""" or False and a (errorcode,error str) tuple """
		sqlcmd = ''
		jsonresult = collections.OrderedDict()
		if urid==None or urid=='':
			result = []	# NOTE: here on error we return empty list - error messages have no meaning here
		else:
			confobj = conf.Conf()
			params = json.loads(confobj.provideConfParams())
			conn = ast.literal_eval(params['connectionstring2'])
			db = MySQLdb.connect(**conn)
			cursor = db.cursor()
			if (ranked=='true'): #harmonize semantics of urid 
				sqlcmd = "SELECT label_index.id FROM label_index, backlink_info WHERE backlink_info.urid = label_index.id AND backlink_info.id = %s"
				cursor.execute(sqlcmd,urid)
				result = cursor.fetchone()
				label_index_id = str(result[0])
			else:
				label_index_id = urid
			sqlcmd = "SELECT label,uri,node FROM label_index left join nodes on label_index.nodeindex=nodes.id where label_index.id = %s"
			cursor.execute(sqlcmd,label_index_id)
			result = cursor.fetchone()
			if result==None:
				result = []
			else: 
				if (result[0]): 
					result0 = result[0].replace('"', '&quot;') 
				else: 
					result0='undefined'
				if (result[1]):
					result1 = result[1]
				else:
					result1='undefined'
				if (result[2]):
					result2 = result[2]
				else:
					result2='outside of BTC scope'
				print "label:" + result0 + ", uri:" + result1 +  ", node:" + result2
				jsonresult[u"label"]=result0
				jsonresult[u"uri"]=result1
				jsonresult[u"node"]=result2
				sqlcmd = "SELECT node, count FROM label_index,backlink_info,nodes WHERE label_index.id = backlink_info.urid and label_index.id = %s and backlink_info.foreignnodeindex=nodes.id order by count desc"
				cursor.execute(sqlcmd,label_index_id)
				result = cursor.fetchall()
				if (result!=None): #we add to json any backlinks existing in backlink_info
					jsonresult[u"backlinksum"]=len(result)
					flagstart = 'true'
					for row in result:
						if (flagstart=='true'):
							jsonresult[u"backlinks"]=collections.OrderedDict()
							flagstart = 'false'
						jsonresult[u"backlinks"][row[0]]=row[1]
			print "Number of rows returned: %d" % cursor.rowcount
			j = json.dumps(jsonresult)
			db.close()
		# as we don't have anything else to do here, we return a succeded defer
		sucdefer = defer.succeed(j)	# result will be passed to any callback attached
		# return the defered
		return sucdefer
		
#SELECT label_index.id,backlink_info.urid,label,uri,count(foreignnode) as backlinksum FROM label_index, backlink_info WHERE backlink_info.urid = label_index.id AND backlink_info.id = 64079
