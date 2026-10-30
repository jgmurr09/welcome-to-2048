"""Verify and copy this self-contained prototype to a static Pages folder."""
from pathlib import Path
import argparse,hashlib,json,shutil
ROOT=Path(__file__).resolve().parent

def sha256(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda:f.read(2**20),b''):h.update(block)
    return h.hexdigest()

def verify_runtime():
    data=json.loads((ROOT/'runtime/model-manifest.json').read_text());whole=hashlib.sha256();size=0
    for item in data['model']['parts']:
        p=ROOT/item['path']
        if not p.is_file() or p.stat().st_size!=item['size'] or sha256(p)!=item['sha256']:raise ValueError('Model asset mismatch: '+item['path'])
        with p.open('rb') as f:
            for block in iter(lambda:f.read(2**20),b''):whole.update(block);size+=len(block)
    if whole.hexdigest()!=data['model']['sha256'] or size!=data['model']['size']:raise ValueError('Combined model mismatch.')
    for item in data['vendorFiles']:
        p=ROOT/item['path']
        if not p.is_file() or sha256(p)!=item['sha256']:raise ValueError('Runtime asset mismatch: '+item['path'])

def prepare(destination):
    destination=Path(destination).resolve()
    if destination==ROOT or ROOT.is_relative_to(destination):raise ValueError('Choose a dedicated output folder.')
    verify_runtime();destination.mkdir(parents=True,exist_ok=True)
    for name in ['index.html','persona-worker.js']:shutil.copy2(ROOT/name,destination/name)
    for name in ['assets','portraits/supplied','runtime']:shutil.copytree(ROOT/name,destination/name,dirs_exist_ok=True,ignore=shutil.ignore_patterns('.*','__pycache__'))
    print('Verified bundled model and runtime. Static site ready:',destination)
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',default='public');args=parser.parse_args();prepare(args.output)
