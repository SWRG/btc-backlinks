# -*- coding: utf-8 -*-
# should run only as module

# this module provides accessor methods for dbpedia KB

from twisted.internet import defer
import MySQLdb
import re
import conf
import ast
import simplejson as json

class DbpediaAccessor:
	
	def __init__(self):
		# TBD
		pass
	
	def get_suggestions(self,term,maxitems,ranked,checked):
		""" queries sphinx indexer and returns the labels that start with - prefix (or containing - infix) the incomming term """
		""" or False and a (errorcode,error str) tuple """
		
		# here we ignore maxitems, but term must be present
		if term==None or term=='':
			result = []	# NOTE: here on error we return empty list - error messages have no meaning here
		else:
			# transform search term for search
			term = term.decode("utf_8")	# convert to unicode
			# connect to DB according to conf.txt
			confobj = conf.Conf()
			params = json.loads(confobj.provideConfParams())
			conn = ast.literal_eval(params['connectionstring'])
			db = MySQLdb.connect(**conn)
			cursor = db.cursor()
			if ranked=='true':  #do some ranking to results according  to their backlinks
				print "checked:" + checked
				if (checked=='0'):
					sqlcmd = "SELECT label FROM autosuggest WHERE MATCH(%s) order by howmanyurid desc, apuricount desc limit 0, 2"
				else:
					sqlcmd = "SELECT label FROM autosuggest WHERE MATCH(%s) and nodeindex=" + checked + "order by howmanyurid desc, apuricount desc limit 0, 2"
			else:
				if (checked=='0'):
					sqlcmd = "SELECT label FROM alphabetical WHERE MATCH(%s) order by label asc limit 0, 150"
				else:
					sqlcmd = "SELECT label FROM alphabetical WHERE MATCH(%s) and nodeindex=" + checked + "order by label asc limit 0, 150"
			"""replace  error prone chars /,(,)," """
			term = term.replace('(','\(')
			term = term.replace(')','\)')
			term = term.replace('"','\"')
			term = term.replace('/','\/')
			cursor.execute(sqlcmd,('*'+term+'*'))
			result = list(cursor.fetchall())
			print "result: ", result
			db.close()
		# as we don't have anything else to do here, we return a succeded defer
		sucdefer = defer.succeed(result)	# result will be passed to any callback attached
		# return the defered
		return sucdefer
