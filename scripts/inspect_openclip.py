import open_clip

tags = open_clip.list_pretrained_tags_by_model('ViT-B-32')
print("Tags for ViT-B-32:", tags)
cfg = open_clip.get_pretrained_cfg('ViT-B-32', 'laion2b_s34b_b79k')
print("Pretrained cfg:", cfg)
