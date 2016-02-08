import collections
import json
class Conf:
	"""When creating the object the constructor parses the :: delimited  txt file conf and creates a dictionary  
	using as key the prefix  and as value the sufix of the corresponing line"""
	parameters = collections.OrderedDict()

	def __init__(self):
		"""We read the text file and parse the content using as delimiter the "::" puting the results in the variable caregories"""
		with open("conf.txt") as f:
			for line in f:
				(key, val) = line.split('::')
				#print "key:" + key + ", val:" + val
				self.parameters[key] = val

	def provideConfParams(self):
		""" a simple method to return the parameters with their values as json object from the Conf class """
		result = self.parameters
		return json.dumps(result)
