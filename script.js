function WriteMailLink(addr, text)
{
	document.write("<a href=\"");
	for(i = addr.length - 2; i >= 0; i--)
	{
		document.write(addr.substr(i, 1));
	}
	document.write(addr.substr(addr.length - 1, 1));
	document.write("\">");
	if(text.length == 0)
	{
		for(i = addr.length - 2; i >= 0; i--)
		{
			document.write(addr.substr(i, 1));
		}
		document.write(addr.substr(addr.length - 1, 1));
	}
	else
	{
		for(i = text.length - 2; i >= 0; i--)
		{
			document.write(text.substr(i, 1));
		}
		document.write(text.substr(text.length - 1, 1));
	}
	document.write("</a>");
}