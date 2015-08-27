git add .
git status
git commit -m '$1'
git push origin master
git checkout gh-pages 
git rebase master 
git push origin gh-pages 
git checkout master 