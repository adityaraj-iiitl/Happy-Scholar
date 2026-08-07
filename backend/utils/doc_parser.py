import zipfile
import xml.etree.ElementTree as ET
import os

def parse_docx(file_path):
    """
    Parses a DOCX file by reading its XML structure.
    No heavy libraries required, runs purely on Python built-ins.
    """
    try:
        with zipfile.ZipFile(file_path) as docx:
            xml_content = docx.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            # Namespace map for Word Processing Markup Language
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            paragraphs = []
            # Find all paragraph elements in the document xml
            for para in root.findall('.//w:p', ns):
                # For each paragraph, find text runs
                texts = [node.text for node in para.findall('.//w:t', ns) if node.text]
                if texts:
                    paragraphs.append("".join(texts))
                    
            return "\n\n".join(paragraphs)
    except Exception as e:
        return f"Error parsing DOCX document: {str(e)}"


def parse_pptx(file_path):
    """
    Parses a PPTX file slide by slide by reading drawing XML tags.
    No pptx libraries required, runs purely on Python built-ins.
    """
    try:
        with zipfile.ZipFile(file_path) as pptx:
            # Slides are named 'ppt/slides/slide1.xml', 'ppt/slides/slide2.xml', etc.
            namelist = pptx.namelist()
            slide_files = [f for f in namelist if f.startswith('ppt/slides/slide') and f.endswith('.xml')]
            
            # Sort slides chronologically by number
            def extract_slide_num(name):
                try:
                    return int(name.replace('ppt/slides/slide', '').replace('.xml', ''))
                except ValueError:
                    return 9999
            
            slide_files.sort(key=extract_slide_num)
            
            # Namespaces for Drawing and Presentation ML
            ns = {
                'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
                'p': 'http://schemas.openxmlformats.org/presentationml/2006/main'
            }
            
            slide_texts = []
            for idx, slide_file in enumerate(slide_files):
                xml_content = pptx.read(slide_file)
                root = ET.fromstring(xml_content)
                
                # Find all text elements in the slide
                texts = []
                for text_node in root.findall('.//a:t', ns):
                    if text_node.text:
                        texts.append(text_node.text)
                
                if texts:
                    slide_texts.append(f"--- Slide {idx + 1} ---\n" + "\n".join(texts))
            
            return "\n\n".join(slide_texts)
    except Exception as e:
        return f"Error parsing PPTX presentation: {str(e)}"


def parse_pdf(file_path):
    """
    Parses a PDF using the pure python pypdf library.
    """
    try:
        import pypdf
        reader = pypdf.PdfReader(file_path)
        text_list = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_list.append(text)
        return "\n\n".join(text_list)
    except ImportError:
        return "Error: pypdf library not installed. PDF parsing unavailable."
    except Exception as e:
        return f"Error parsing PDF document: {str(e)}"


def extract_text_from_file(file_path, file_extension):
    """
    Helper routing to the correct parser based on file extension.
    """
    ext = file_extension.lower().strip('.')
    if ext == 'docx':
        return parse_docx(file_path)
    elif ext == 'pptx' or ext == 'ppt':
        return parse_pptx(file_path)
    elif ext == 'pdf':
        return parse_pdf(file_path)
    elif ext in ['txt', 'md', 'py', 'json', 'csv', 'html']:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except Exception as e:
            return f"Error reading text file: {str(e)}"
    else:
        return f"Unsupported file type: .{ext}"
