CGraph.treeBuilder = function(llamadoTree){
  var margin = {top: 20, right: 120, bottom: 20, left: 120},
    width = 960 - margin.right - margin.left,
    height = 675 - margin.top - margin.bottom;
    
  var i = 0,
      duration = 750,
      root;

  var tree = d3.layout.tree()
      .size([height, width]);

  var diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.y, d.x]; });

  var svg;
  function setUp(){
    svg = d3.select("#viz-container").append("svg")
        .attr("class", "fondo-gris")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  };

  function drawTree(llamadoTree){
    setUp();
    root = llamadoTree;
    root.x0 = height / 2;
    root.y0 = 0;

    function collapse(d) {
      if (d.children && d.children.length > 0) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    }

    //root.children.forEach(collapse);
    update(root);
  }


  function contentByNode(nodo){
    var source, template, context, content = 'Probando';
    switch(nodo.depth){
      case 0:
        source  = $("#nodo-planificacion").html();
        context = {titulo: nodo.name, fecha: nodo.fechaEstimada};
        break;

      case 1:
        source = $("#nodo-convocatoria").html();
        context = {titulo: nodo.name, fecha: nodo.fechaPublicacion, estado: nodo.estado};
        break;

      case 2:
        source = $("#nodo-adjudicacion").html();
        context = {titulo: nodo.name, fecha: nodo.fechaPublicacion};
        break;

      case 3:
        source = $("#nodo-contrato").html();
        context = {titulo: nodo.name, fecha: nodo.fechaFirmaContrato, estado: nodo.estado, proveedor: nodo.proveedor, monto: nodo.monto};
    }

    if(source){
      template = Handlebars.compile(source);
      content = template(context);
    }
    return content;
  }

  function widthByNode(nodo){
    var width = 142;
    //Contrato
    if(nodo.depth === 3){
      width = 274;
    }
    return width;
  }

  function yOffsetByNode(nodo){
    var yOffset = -71;
    //Contrato
    if(nodo.depth === 3){
      yOffset = -50;
    }
    return yOffset;
  }

  function update(source) {

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);
    
    var maxNodesByDepth = _(nodes).countBy(function(n){ return n.depth; }).values().max();
    height = (200 * maxNodesByDepth < 675) ? 675 : 200 * maxNodesByDepth; 
    d3.select('svg').attr("height", height + margin.top + margin.bottom);
    
    tree = d3.layout.tree().size([height, width]);
    nodes = tree.nodes(root).reverse();
    links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 180; });
    // Update the nodes…
    var node = svg.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
        .on("click", click);


    /*nodeEnter.append("image")
        .attr("xlink:href", function(d) { return d.icon; })
        .attr("x", "-50px")
        .attr("y", "-50px")
        .attr("width", "100px")
        .attr("height", "100px");*/

    nodeEnter.append('foreignObject')
        .attr("x", -71)
        .attr("y", yOffsetByNode)
        .attr("width", widthByNode)
        .attr("height", 142)
        .append("xhtml:div")
        .html(contentByNode);

      /*nodeEnter.append("circle")
        .attr("r", 1e-6)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });*/


    /*nodeEnter.append("text")
        .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
        .attr("dy", ".35em")
        .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
        .text(function(d) { return d.name; })
        .style("fill-opacity", 1e-6);*/

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    nodeUpdate.select("circle")
        .attr("r", 4.5)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

    nodeUpdate.select("text")
        .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.link")
        .data(links, function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("fill", "white")
        .attr("stroke-width", "10px")
        .attr("d", function(d) {
          var o = {x: source.x0, y: source.y0};
          return diagonal({source: o, target: o});
        });

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
          var o = {x: source.x, y: source.y};
          return diagonal({source: o, target: o});
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  // Toggle children on click.
  function click(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update(d);
  }

  return {drawTree: drawTree};

}();


$(document).ready(function(){
  //Remote
  CGraph.graphService.getTree('193399-adquisicion-scanner').then(function(llamadoTree){
    CGraph.treeBuilder.drawTree(llamadoTree);
  });

  /*d3.json('scripts/llamado.json', function(llamadoTree){
    drawTree(llamadoTree);
  });*/
});