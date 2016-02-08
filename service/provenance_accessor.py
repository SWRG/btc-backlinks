# -*- coding: utf-8 -*-
# should run only as module

# this module provides accessor methods for dbpedia KB

from twisted.internet import defer
import MySQLdb
import collections
from collections import defaultdict
import re
import simplejson as json
import conf
import ast

class ProvenanceAccessor:
	
	def __init__(self):
		# TBD
		pass
	
	def get_provenanceInfo(self):
		""" queries the sphinx indexer and returns various data """
		""" or False and a (errorcode,error str) tuple """
		sqlcmd = ''
		#jsonresult = '{}'
		jsonresult = collections.OrderedDict()
		confobj = conf.Conf()
		params = json.loads(confobj.provideConfParams())
		conn = ast.literal_eval(params['connectionstring']) 
		db = MySQLdb.connect(**conn)
		cursor = db.cursor()
		sqlcmd = "select node, howmanyuris from provenance where match(%s) order by howmanyuris desc limit 0, 1000"
		q = 'http:*'
		cursor.execute(sqlcmd,q)
		result = cursor.fetchall()
		totaluris = 0;
		if (result!=None):
			flagstart = 'true'
			for row in result:
				if (flagstart=='true'):
					jsonresult[u"nodes"]=[]
					jsonresult[u"nodesindex"]=[]
					jsonresult[u"howmanyuris"]=[]
					flagstart = 'false'
				jsonresult[u"nodes"].append(row[2])
				jsonresult[u"nodesindex"].append(row[0])
				jsonresult[u"howmanyuris"].append(row[3])
				totaluris += row[3];
			jsonresult[u"totaluris"]=str(totaluris)
		print "Number of rows returned: %d" % cursor.rowcount
		db.close()
		j = json.dumps(jsonresult)
		# as we don't have anything else to do here, we return a succeded defer
		sucdefer = defer.succeed(j)	# result will be passed to any callback attached
		# return the defered
		return sucdefer
