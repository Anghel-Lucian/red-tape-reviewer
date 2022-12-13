import Streamify from "streamify-string";
import rdfParser from 'rdf-parse';
const stream = Streamify("<?xml version='1.0'?><rdf:RDF xmlns:rdf='http://www.w3.org/1999/02/22-rdf-syntax-ns#' xmlns:dc='http://purl.org/dc/elements/1.1/' xmlns:ex='http://example.org/stuff/1.0/'><rdf:Description rdf:about='http://www.w3.org/TR/rdf-syntax-grammar' dc:title='RDF1.1 XML Syntax'><ex:editor><rdf:Description ex:fullName='Dave Beckett'><ex:homePage rdf:resource='http://purl.org/net/dajobe/' /></rdf:Description></ex:editor></rdf:Description></rdf:RDF>");

rdfParser.default.parse(stream, {contentType: 'application/rdf+xml'})
  .on('data', (quad) => {
    console.log(quad);
  })
  .on('error', (error) => console.log(error))
  .on('end', () => console.log("parsing ending"));
