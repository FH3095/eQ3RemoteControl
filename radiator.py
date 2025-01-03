#!/usr/bin/env python3

import os, sys, subprocess, tomllib, json, traceback, urllib.parse

def getQueryData():
	data = {}
	env = os.environ
	if "QUERY_STRING" not in env:
		return data
	for param in env["QUERY_STRING"].split("&"):
		if len(param) >= 1:
			keyVal = param.split("=", 1)
			if len(keyVal) == 2:
				data[keyVal[0]] = keyVal[1]
			else:
				data[keyVal[0]] = ""
	return data

def getPostData():
	env = os.environ
	contentLength = int(env.get("CONTENT_LENGTH", default=0))
	if contentLength < 1:
		return {}
	formData = sys.stdin.buffer.read(contentLength).decode()
	return urllib.parse.parse_qs(formData, strict_parsing=True)

headerPrinted = False
def defaultHeader():
	global headerPrinted
	if headerPrinted:
		return
	print("status: 200 OK")
	print("content-type: application/json")
	print()
	headerPrinted = True

def redirect():
	print("status: 303 See Other")
	print("location: " + CONFIG["webRoot"] + "radiator.html")
	print()

def runProcess(*params):
	proc = subprocess.run(params, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
	if proc.returncode != 0:
		raise Exception("Cant run process " + str(params) + ": " + str(proc.stdout))
	proc.check_returncode()
	return proc.stdout

def runEq3(mac, *params):
	return runProcess(CONFIG["eq3Path"], mac, *params)

def out(**data):
	print(json.dumps(dict(data)))

def getRooms():
	result = []
	for item in CONFIG.items():
		if isinstance(item[1], dict):
			result.append(item[0])
	return result

def getStatus(room):
	mac = CONFIG[room]["mac"]
	return json.loads(runEq3(mac, "json"))

def setMode(room, mode):
	if mode == "auto":
		return runEq3(CONFIG[room]["mac"], "auto")
	elif mode == "manual":
		return runEq3(CONFIG[room]["mac"], "manual")
	else:
		raise Exception("Unknwon mode")

def setTemp(room, temp):
	return runEq3(CONFIG[room]["mac"], "temp", str(int(temp)))


try:
	with open("config.toml", "rb") as f:
		CONFIG = tomllib.load(f)
	qParams = getQueryData()
	pParams = getPostData()
	cmd = qParams.get("cmd")

	if cmd == "rooms":
		defaultHeader()
		out(rooms=getRooms())
	elif cmd == "status":
		defaultHeader()
		out(**getStatus(qParams["room"]))
	elif cmd == "mode":
		setMode(qParams["room"], pParams["mode"][0])
		redirect()
	elif cmd == "temp":
		setTemp(qParams["room"], pParams["temp"][0])
		redirect()
	else:
		defaultHeader()
		out(error="Unknown cmd")
except BaseException as exception:
	defaultHeader()
	out(error=''.join(traceback.format_exception(exception)))

