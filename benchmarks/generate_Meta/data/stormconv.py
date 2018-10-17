import subprocess


stormBinDir = "/Users/tim/storm/cmake-build-debug/bin/"
#stormBinDir = "/Users/tim/storm/build/bin/"
stormConvBinaryName = "storm-conv"
stormConv = stormBinDir + stormConvBinaryName

def getToolInfo():
    res = dict();
    stormOutput = subprocess.check_output(stormConv)
    pos1 = stormOutput.find(" ")
    res["tool"] = stormOutput[0:pos1]
    res["version"] = stormOutput[pos1+1:].strip('\n')
    res["url"] = "http://www.stormchecker.org"
    res["executablename"] = stormConvBinaryName

    return res


def getCommandPrismToJani(prismFile, janiOutputFile, propertyfile = "", constants = dict(), additionalOptions = []):
    commands = [stormConv]
    
    # specify prism input
    commands.append("--prism")
    commands.append(prismFile)
    
    # specify jani output
    commands.append("--tojani")
    commands.append(janiOutputFile)
    
    # specify property input
    if propertyfile != "":
        commands.append("--prop")
        commands.append(propertyfile)
    
    # specify constants
    constantsDefString = ""
    empty = True
    for constantIdentifier in constants:
        if not empty:
            constantsDefString = constantsDefString + ","
        empty = False
        constantsDefString = constantsDefString + constantIdentifier + "={}".format(constants[constantIdentifier])
    if not empty:
        commands.append("--constants")
        commands.append(constantsDefString)

    # append additional options
    commands += additionalOptions
    
    return commands

    