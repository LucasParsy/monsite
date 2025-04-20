### table of content:
dans "Post.html", 
```ruby
    {% include toc.html html=content class="toc"
     item_class="toc_item"
    submenu_class="toc_submenu"
     anchor_class="toc_anchor" %}
```
#todo : le bouger dans une navbar et le styler

### css
syntax highlight: fruity.css


```css
code block inline: 

code: {
    color: orange
}

pre code {
    color: var(--color-text-main);
}



.highlighter-rouge code  {
  color: orange;
}

```
style.css:
 markdown-toc



### replace images

```bash

sed -i -E 's/!\[\[([^|]+)\|([^]]+)\]\]/<figure><img src="\/assets\/img\/\1" alt="\2"> <figcaption>\2<\/figcaption> <\/figure>/g' test.txt


```


### liste des 5 derniers posts:

limit:5

```javascript
{%- if page.feedformat == "card" -%}
    {%- if site.preferences.search.enabled -%}
        <!-- search bar -->
        <div class="block">
            <input class="input is-medium" type="text" placeholder="Search notes.." id="search-input" autocomplete="off">
            <div id="search-results" class="search-results"></div>
        </div>
        <script type="text/javascript" src="{{ site.baseurl }}/assets/js/vendor/lunr.min.js"></script>
        <script src="{{ site.baseurl }}/assets/js/Search.js"></script>
    {%- endif -%}
    <!-- feed with filter-->
    <div class="related-wrapper">
    {% assign note_items = site.notes | sort: "date" | reverse %}
    {% for note_items in note_items limit:5 %}
        {%- if note_items.feed == "show" -%}
                <div class="notelist-feed">
                    <a href="{{ site.baseurl }}{{note_items.url}}">
                        <h6>{{ note_items.title }}</h6>
                        <p class="excerpt">
                            {{ note_items.summary | strip_html | strip | remove: "[[" | remove: "]]" | remove: "-" | escape | truncate: 200 }}
                        </p>
                    </a>
                </div>
        {%- endif -%}
    {%- endfor -%}
    </div>
{%-endif -%}
```

#### test

        {%- assign tables = content | split:'<table>' -%}
        {%- for item in tables -%}
            {%- assign m_end = item | split:'</table>' -%}
            {%- assign msl = m_end[0] | split:'![[assets/img/' -%}
            {%- assign m_se = m_sl[0] | split:'</td>' -%}

            {{ m_se  |inspect }}<br><br>

            {%- assign replaced_content = replaced_content | replace: end[0],'couc' -%}
        {%- endfor -%}



            {%- assign linkImgPath = '1-how-to.png' -%}
            {%- assign linkCaption = 'caca' -%}

            {%- assign table_replacing = '<figure><img src="/assets/img/' | append: linkImgPath | append: '" alt="' | append: linkCaption | append:'"> <figcaption>' | append: linkCaption  | append:'</figcaption> </figure>' -%}
            {%- assign replaced_content = replaced_content | replace: '<table>  <tbody>    <tr>      <td>![[assets/img/1-how-to.png</td>      <td>truc]]</td>    </tr>  </tbody></table>',table_replacing -%}
